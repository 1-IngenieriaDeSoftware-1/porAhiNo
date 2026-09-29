"""
Servicio: Consulta de Pico y Placa (US-002, US-003).

Responsabilidades:
- Determinar si una placa tiene restricción en un municipio/fecha/hora
- Consultar decretos vigentes de forma optimizada (<1 segundo)
- Guardar historial de consultas (US-DB-05)

Algoritmo de consulta:
  1. Obtener el último dígito de la placa
  2. Buscar decretos activos para el municipio en la fecha dada
  3. Verificar si el día de la semana está restringido
  4. Verificar si el horario está dentro del rango de restricción
  5. Verificar si el dígito de la placa está en los dígitos restringidos
  6. Retornar resultado con mensaje legible
"""

from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.placa import ultimo_digito, validar_placa
from app.core.timezone import a_colombia, ahora_colombia
from app.models.consulta import Consulta
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.consulta import ConsultaRequest, ConsultaResponse, RestriccionDetalle


def decretos_vigentes_stmt(municipio_id: int, fecha: date) -> Select:
    """SELECT indexado: municipio + vigencia + activos (US-DB-06)."""
    return (
        select(Decreto)
        .where(
            Decreto.municipio_id == municipio_id,
            Decreto.is_active.is_(True),
            Decreto.vigencia_desde <= fecha,
            or_(Decreto.vigencia_hasta.is_(None), Decreto.vigencia_hasta >= fecha),
        )
    )


def calcular_restriccion(
    placa: str, decreto: Decreto, fecha_hora: datetime
) -> bool:
    """
    Lógica pura de verificación de restricción (sin acceso a BD).
    Fácil de unit-testear (US-002.2, REQ-FUNC-002).

    1. Asegura zona horaria America/Bogota (si es naive se asume Bogotá)
    2. Comprueba decreto activo y vigencia temporal
    3. Verifica día de la semana (0=Lunes ... 6=Domingo)
    4. Verifica rango de horario (hora_inicio <= hora <= hora_fin)
    5. Verifica dígito restringido (último número, compatible con particulares y motos)
    """
    dt = a_colombia(fecha_hora)

    # 1. Decreto activo y vigencia
    if getattr(decreto, "is_active", True) is False:
        return False
    if decreto.vigencia_desde and dt.date() < decreto.vigencia_desde:
        return False
    if decreto.vigencia_hasta and dt.date() > decreto.vigencia_hasta:
        return False

    # 2. Verificar día de la semana (0=Lunes ... 6=Domingo)
    if dt.weekday() not in decreto.lista_dias():
        return False

    # 3. Verificar rango de horario
    hora_actual = dt.time()
    if not (decreto.hora_inicio <= hora_actual <= decreto.hora_fin):
        return False

    # 4. Verificar dígito restringido
    digito = ultimo_digito(placa)
    if digito not in decreto.lista_digitos():
        return False

    return True


class ConsultaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def verificar_restriccion(
        self, payload: ConsultaRequest, usuario: Optional[Usuario] = None
    ) -> ConsultaResponse:
        """
        Verifica si una placa tiene restricción de Pico y Placa.
        Debe responder en <1 segundo (US-002, AC-003, AC-004).
        """
        fecha_hora = (
            a_colombia(payload.fecha_hora)
            if payload.fecha_hora
            else ahora_colombia()
        )

        municipio = await self.db.get(Municipio, payload.municipio_id)
        if municipio is None:
            raise NotFoundError("Municipio no encontrado")

        decretos = await self.buscar_decretos_vigentes(
            municipio.id, fecha_hora.date()
        )

        decreto_restringido: Optional[Decreto] = None
        for decreto in decretos:
            if self._calcular_restriccion(payload.placa, decreto, fecha_hora):
                decreto_restringido = decreto
                break

        tiene_restriccion = decreto_restringido is not None

        if tiene_restriccion and decreto_restringido is not None:
            hora_ini_str = decreto_restringido.hora_inicio.strftime("%H:%M")
            hora_fin_str = decreto_restringido.hora_fin.strftime("%H:%M")
            detalle = RestriccionDetalle(
                decreto_id=decreto_restringido.id,
                hora_inicio=hora_ini_str,
                hora_fin=hora_fin_str,
                dias_restriccion=decreto_restringido.lista_dias(),
                digitos_restringidos=decreto_restringido.lista_digitos(),
                descripcion=decreto_restringido.descripcion,
            )
            mensaje = (
                f"¡Pico y Placa Activo! El vehículo con placa {payload.placa} "
                f"tiene restricción en {municipio.nombre} de "
                f"{hora_ini_str} a {hora_fin_str}."
            )
        else:
            detalle = None
            mensaje = (
                f"Sin restricción. El vehículo con placa {payload.placa} "
                f"puede circular en {municipio.nombre}."
            )

        id_usuario = usuario.id if usuario else None
        id_vehiculo: Optional[int] = None
        if id_usuario:
            query = select(Vehiculo.id).where(
                Vehiculo.id_usuario == id_usuario,
                Vehiculo.placa == payload.placa,
            )
            res_v = await self.db.execute(query)
            id_vehiculo = res_v.scalar_one_or_none()

        await self.registrar_historial(
            placa=payload.placa,
            municipio_id=municipio.id,
            resultado_restringido=tiene_restriccion,
            fecha_verificada=fecha_hora,
            id_usuario=id_usuario,
            id_vehiculo=id_vehiculo,
        )

        return ConsultaResponse(
            placa=payload.placa,
            municipio=municipio.nombre,
            fecha_hora_consultada=fecha_hora,
            tiene_restriccion=tiene_restriccion,
            detalle=detalle,
            mensaje=mensaje,
        )

    async def get_municipios_activos(self) -> List[Municipio]:
        """
        Retorna municipios que tienen al menos un decreto activo (US-003).
        """
        stmt = (
            select(Municipio)
            .join(Decreto, Decreto.municipio_id == Municipio.id)
            .where(Decreto.is_active.is_(True))
            .distinct()
            .order_by(Municipio.nombre)
        )
        result = await self.db.execute(stmt)
        municipios = list(result.scalars().all())
        if not municipios:
            # Fallback para desarrollo si aún no se han asociado decretos
            result_all = await self.db.execute(
                select(Municipio).order_by(Municipio.nombre)
            )
            municipios = list(result_all.scalars().all())
        return municipios

    async def buscar_decretos_vigentes(
        self, municipio_id: int, fecha: Optional[date] = None
    ) -> List[Decreto]:
        """Decretos activos vigentes para un municipio/fecha. Objetivo < 1 s."""
        dia = fecha or ahora_colombia().date()
        result = await self.db.execute(decretos_vigentes_stmt(municipio_id, dia))
        return list(result.scalars().all())

    async def registrar_historial(
        self,
        placa: str,
        municipio_id: int,
        resultado_restringido: bool,
        fecha_verificada: Optional[datetime] = None,
        id_usuario: Optional[int] = None,
        id_vehiculo: Optional[int] = None,
    ) -> Consulta:
        """
        Persiste una consulta (US-DB-05). id_usuario / id_vehiculo pueden ser None
        si el conductor consulta sin iniciar sesión.
        """
        consulta = Consulta(
            placa_consultada=validar_placa(placa),
            municipio_id=municipio_id,
            resultado_restringido=resultado_restringido,
            fecha_verificada=(
                a_colombia(fecha_verificada)
                if fecha_verificada
                else ahora_colombia()
            ),
            id_usuario=id_usuario,
            id_vehiculo=id_vehiculo,
        )
        self.db.add(consulta)
        await self.db.flush()
        await self.db.refresh(consulta)
        return consulta

    @staticmethod
    def _calcular_restriccion(
        placa: str, decreto: Decreto, fecha_hora: datetime
    ) -> bool:
        """
        Lógica pura de verificación de restricción delegada (US-002.2).
        Puede llamarse tanto desde la instancia como desde la clase ConsultaService.
        """
        return calcular_restriccion(placa, decreto, fecha_hora)

