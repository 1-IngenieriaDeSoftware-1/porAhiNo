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

from datetime import datetime
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.placa import validar_placa
from app.core.timezone import a_colombia, ahora_colombia
from app.models.consulta import Consulta
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.schemas.consulta import ConsultaRequest, ConsultaResponse


class ConsultaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def verificar_restriccion(self, payload: ConsultaRequest) -> ConsultaResponse:
        """
        Verifica si una placa tiene restricción de Pico y Placa.
        Debe responder en <1 segundo.

        TODO:
          1. Obtener fecha/hora actual Colombia (America/Bogota) si no se provee
          2. Buscar decretos vigentes para el municipio
             (usar índice ix_decretos_municipio_vigencia)
          3. Aplicar algoritmo de verificación de dígitos
          4. Registrar consulta en historial (registrar_historial)
          5. Retornar ConsultaResponse con mensaje legible
        """
        raise NotImplementedError("Consulta de restricción pendiente (US-002)")

    async def get_municipios_activos(self) -> List[Municipio]:
        """
        Retorna municipios que tienen al menos un decreto activo (US-003).
        TODO: JOIN municipios + decretos WHERE is_active = True
        """
        raise NotImplementedError("Listado de municipios pendiente (US-003)")

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
            fecha_verificada=a_colombia(fecha_verificada) if fecha_verificada else ahora_colombia(),
            id_usuario=id_usuario,
            id_vehiculo=id_vehiculo,
        )
        self.db.add(consulta)
        await self.db.flush()
        await self.db.refresh(consulta)
        return consulta

    def _calcular_restriccion(self, placa: str, decreto: Decreto, fecha_hora: datetime) -> bool:
        """
        Lógica pura de verificación de restricción (sin acceso a BD).
        Fácil de unit-testear.

        TODO:
          1. Extraer último dígito de la placa
          2. Verificar día de la semana
          3. Verificar horario
          4. Verificar dígito restringido
        """
        raise NotImplementedError
