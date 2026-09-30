"""
Tests: Servicio de consulta de Pico y Placa (US-002, US-002.1).

Cubre:
- Placa restringida en horario → tiene_restriccion=True (AC-003)
- Placa sin restricción → False (AC-004)
- Fin de semana / fuera de horario → False
- Placas de moto (ABC12D) evalúan el dígito correcto
- Municipio inexistente → NotFoundError (404)
- Municipio sin decreto activo → tiene_restriccion=False
- Consulta anónima y autenticada registran historial
"""

from datetime import date, datetime, time
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.exceptions import NotFoundError
from app.core.timezone import ZONA_COLOMBIA
from app.models.decreto import Decreto
from app.models.municipio import Municipio
from app.models.usuario import Usuario
from app.schemas.consulta import ConsultaRequest
from app.services.consulta_service import ConsultaService, calcular_restriccion


def _crear_decreto(
    decreto_id: int = 1,
    municipio_id: int = 1,
    hora_inicio: time = time(6, 0),
    hora_fin: time = time(20, 0),
    dias: str = "0,1,2,3,4",
    digitos: str = "3,4",
    vigencia_desde: date = date(2026, 1, 1),
    vigencia_hasta: date = date(2026, 12, 31),
    descripcion: str = "Decreto de prueba",
) -> Decreto:
    decreto = Decreto(
        id=decreto_id,
        municipio_id=municipio_id,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        dias_restriccion=dias,
        digitos_restringidos=digitos,
        vigencia_desde=vigencia_desde,
        vigencia_hasta=vigencia_hasta,
        descripcion=descripcion,
        is_active=True,
    )
    return decreto


def test_calcular_restriccion_placa_restringida_en_horario() -> None:
    """AC-003: Placa restringida en horario pico retorna True."""
    decreto = _crear_decreto(dias="0,1,2,3,4", digitos="3,4", hora_inicio=time(6, 0), hora_fin=time(20, 0))
    # 2026-09-28 es Lunes (weekday 0)
    fecha_hora = datetime(2026, 9, 28, 7, 30, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC123", decreto, fecha_hora) is True
    assert calcular_restriccion("ABC124", decreto, fecha_hora) is True


def test_calcular_restriccion_placa_sin_restriccion_por_digito() -> None:
    """AC-004: Placa con dígito no restringido retorna False."""
    decreto = _crear_decreto(dias="0,1,2,3,4", digitos="3,4")
    fecha_hora = datetime(2026, 9, 28, 8, 0, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC125", decreto, fecha_hora) is False
    assert calcular_restriccion("ABC120", decreto, fecha_hora) is False


def test_calcular_restriccion_fuera_de_horario() -> None:
    """Fuera del rango horario retorna False."""
    decreto = _crear_decreto(hora_inicio=time(6, 0), hora_fin=time(20, 0), digitos="3,4")
    # Lunes a las 21:00 (después de hora_fin)
    fecha_despues = datetime(2026, 9, 28, 21, 0, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC123", decreto, fecha_despues) is False

    # Lunes a las 05:45 (antes de hora_inicio)
    fecha_antes = datetime(2026, 9, 28, 5, 45, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC123", decreto, fecha_antes) is False


def test_calcular_restriccion_fin_de_semana() -> None:
    """Sábado y domingo no tienen restricción según el decreto lun-vie."""
    decreto = _crear_decreto(dias="0,1,2,3,4", digitos="3,4")
    # 2026-10-03 es Sábado (weekday 5)
    sabado = datetime(2026, 10, 3, 10, 0, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC123", decreto, sabado) is False
    # 2026-10-04 es Domingo (weekday 6)
    domingo = datetime(2026, 10, 4, 10, 0, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC123", decreto, domingo) is False


def test_calcular_restriccion_moto_digito_correcto() -> None:
    """Para moto (ABC12D), el dígito evaluado es el último numérico (2), no la letra."""
    decreto = _crear_decreto(dias="0,1,2,3,4", digitos="2,5")
    fecha_hora = datetime(2026, 9, 28, 12, 0, tzinfo=ZONA_COLOMBIA)
    # ABC12D termina en dígito 2 -> restringida
    assert calcular_restriccion("ABC12D", decreto, fecha_hora) is True
    # ABC13D termina en dígito 3 -> no restringida
    assert calcular_restriccion("ABC13D", decreto, fecha_hora) is False


@pytest.mark.asyncio
async def test_verificar_restriccion_municipio_inexistente() -> None:
    """Lanza NotFoundError si el municipio no existe."""
    db = AsyncMock()
    db.get = AsyncMock(return_value=None)
    service = ConsultaService(db)

    payload = ConsultaRequest(placa="ABC123", municipio_id=999)
    with pytest.raises(NotFoundError):
        await service.verificar_restriccion(payload)


@pytest.mark.asyncio
async def test_verificar_restriccion_sin_decretos_activos() -> None:
    """Si el municipio no tiene decretos vigentes, responde sin restricción."""
    db = AsyncMock()
    municipio = Municipio(id=2, nombre="Medellín", departamento="Antioquia", codigo_dane="05001")
    db.get = AsyncMock(return_value=municipio)
    db.execute = AsyncMock(return_value=MagicMock(scalars=lambda: MagicMock(all=lambda: [])))
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = ConsultaService(db)
    payload = ConsultaRequest(
        placa="ABC123",
        municipio_id=2,
        fecha_hora=datetime(2026, 9, 28, 8, 0, tzinfo=ZONA_COLOMBIA),
    )
    response = await service.verificar_restriccion(payload)

    assert response.tiene_restriccion is False
    assert response.detalle is None
    assert "Sin restricción" in response.mensaje
    assert "Medellín" in response.mensaje
    assert response.placa == "ABC123"


@pytest.mark.asyncio
async def test_verificar_restriccion_con_restriccion_activa() -> None:
    """AC-003: Si hay restricción, retorna detalle y mensaje de alerta roja."""
    db = AsyncMock()
    municipio = Municipio(id=1, nombre="Bogotá", departamento="Cundinamarca", codigo_dane="11001")
    decreto = _crear_decreto(
        decreto_id=10,
        municipio_id=1,
        dias="0,1,2,3,4",
        digitos="1,2",
        hora_inicio=time(6, 0),
        hora_fin=time(21, 0),
        descripcion="Bogotá particular",
    )
    db.get = AsyncMock(return_value=municipio)
    db.execute = AsyncMock(return_value=MagicMock(scalars=lambda: MagicMock(all=lambda: [decreto])))
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = ConsultaService(db)
    # Lunes a las 08:00 con placa terminada en 1
    payload = ConsultaRequest(
        placa="ABC121",
        municipio_id=1,
        fecha_hora=datetime(2026, 9, 28, 8, 0, tzinfo=ZONA_COLOMBIA),
    )
    response = await service.verificar_restriccion(payload)

    assert response.tiene_restriccion is True
    assert response.detalle is not None
    assert response.detalle.decreto_id == 10
    assert response.detalle.hora_inicio == "06:00"
    assert response.detalle.hora_fin == "21:00"
    assert "¡Pico y Placa Activo!" in response.mensaje
    assert "Bogotá" in response.mensaje


@pytest.mark.asyncio
async def test_verificar_restriccion_sin_restriccion_ac_004() -> None:
    """AC-004 / US-002.4: Si no hay restricción para el vehículo, retorna mensaje confirmando sin restricción y detalle None."""
    db = AsyncMock()
    municipio = Municipio(id=1, nombre="Bogotá", departamento="Cundinamarca", codigo_dane="11001")
    decreto = _crear_decreto(
        decreto_id=10,
        municipio_id=1,
        dias="0,1,2,3,4",
        digitos="1,2",
        hora_inicio=time(6, 0),
        hora_fin=time(21, 0),
        descripcion="Bogotá particular",
    )
    db.get = AsyncMock(return_value=municipio)
    db.execute = AsyncMock(return_value=MagicMock(scalars=lambda: MagicMock(all=lambda: [decreto])))
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = ConsultaService(db)
    # Lunes a las 08:00 con placa terminada en 3 (no restringida)
    payload = ConsultaRequest(
        placa="ABC123",
        municipio_id=1,
        fecha_hora=datetime(2026, 9, 28, 8, 0, tzinfo=ZONA_COLOMBIA),
    )
    response = await service.verificar_restriccion(payload)

    assert response.tiene_restriccion is False
    assert response.detalle is None
    assert "Sin restricción" in response.mensaje
    assert "ABC123" in response.mensaje
    assert "Bogotá" in response.mensaje


@pytest.mark.asyncio
async def test_verificar_restriccion_guarda_historial_con_usuario() -> None:
    """Registra id_usuario en historial cuando el usuario está autenticado."""
    db = AsyncMock()
    municipio = Municipio(id=1, nombre="Bogotá", departamento="Cundinamarca", codigo_dane="11001")
    db.get = AsyncMock(return_value=municipio)
    db.execute = AsyncMock(
        return_value=MagicMock(
            scalars=lambda: MagicMock(all=lambda: []),
            scalar_one_or_none=lambda: 99,  # id_vehiculo mock
        )
    )
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    usuario = Usuario(id=42, email="conductor@test.co")
    service = ConsultaService(db)
    payload = ConsultaRequest(placa="ABC123", municipio_id=1)
    response = await service.verificar_restriccion(payload, usuario=usuario)

    assert response.placa == "ABC123"
    assert db.add.called
    consulta_guardada = db.add.call_args[0][0]
    assert consulta_guardada.id_usuario == 42


@pytest.mark.asyncio
async def test_verificar_restriccion_consulta_anonima_publica() -> None:
    """US-002.1: La consulta pública no exige login y guarda historial anónimo."""
    db = AsyncMock()
    municipio = Municipio(id=1, nombre="Bogotá", departamento="Cundinamarca", codigo_dane="11001")
    db.get = AsyncMock(return_value=municipio)
    db.execute = AsyncMock(
        return_value=MagicMock(
            scalars=lambda: MagicMock(all=lambda: []),
        )
    )
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = ConsultaService(db)
    # Sin usuario (anónimo)
    payload = ConsultaRequest(placa="abc123", municipio_id=1)
    response = await service.verificar_restriccion(payload, usuario=None)

    assert response.placa == "ABC123"
    assert db.add.called
    consulta_guardada = db.add.call_args[0][0]
    assert consulta_guardada.id_usuario is None
    assert consulta_guardada.id_vehiculo is None


def test_consulta_request_normaliza_mayusculas_us_002_1() -> None:
    """US-002.1: Placa en minúsculas y con espacios se normaliza a mayúsculas."""
    req = ConsultaRequest(placa=" abc123 ", municipio_id=1)
    assert req.placa == "ABC123"

    req_moto = ConsultaRequest(placa="xyz98w", municipio_id=2)
    assert req_moto.placa == "XYZ98W"


def test_consulta_request_rechaza_placa_invalida_ac_002() -> None:
    """AC-002: Formato de placa inválido lanza error de validación."""
    with pytest.raises(ValueError):
        ConsultaRequest(placa="123456", municipio_id=1)

    with pytest.raises(ValueError):
        ConsultaRequest(placa="TOOLONG123", municipio_id=1)


@pytest.mark.asyncio
async def test_get_municipios_activos_retorna_lista() -> None:
    """US-003: Retorna municipios con decreto activo."""
    db = AsyncMock()
    municipios = [
        Municipio(id=1, nombre="Bogotá", departamento="Cundinamarca", codigo_dane="11001"),
        Municipio(id=2, nombre="Medellín", departamento="Antioquia", codigo_dane="05001"),
    ]
    db.execute = AsyncMock(return_value=MagicMock(scalars=lambda: MagicMock(all=lambda: municipios)))

    service = ConsultaService(db)
    resultado = await service.get_municipios_activos()
    assert len(resultado) == 2
    assert resultado[0].nombre == "Bogotá"
    assert resultado[1].nombre == "Medellín"


def test_calcular_restriccion_vigencia_expirada_us_002_2() -> None:
    """US-002.2: Decreto expirado no aplica restricción."""
    decreto = _crear_decreto(
        vigencia_desde=date(2025, 1, 1),
        vigencia_hasta=date(2025, 12, 31),
        dias="0,1,2,3,4",
        digitos="3,4",
    )
    # Fecha en 2026 (después de vigencia_hasta)
    fecha_hora = datetime(2026, 9, 28, 8, 0, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC123", decreto, fecha_hora) is False


def test_calcular_restriccion_decreto_inactivo_us_002_2() -> None:
    """US-002.2: Decreto con is_active=False no restringe."""
    decreto = _crear_decreto(dias="0,1,2,3,4", digitos="3,4")
    decreto.is_active = False
    fecha_hora = datetime(2026, 9, 28, 8, 0, tzinfo=ZONA_COLOMBIA)
    assert calcular_restriccion("ABC123", decreto, fecha_hora) is False


def test_calcular_restriccion_con_fecha_naive_asume_bogota_us_002_2() -> None:
    """US-002.2: Fecha naive sin tzinfo se interpreta en America/Bogota."""
    decreto = _crear_decreto(
        dias="0,1,2,3,4",
        digitos="3,4",
        hora_inicio=time(6, 0),
        hora_fin=time(20, 0),
    )
    # Datetime sin tzinfo (naive) correspondiente a lunes a las 07:30
    naive_dt = datetime(2026, 9, 28, 7, 30)
    assert calcular_restriccion("ABC123", decreto, naive_dt) is True


def test_calcular_restriccion_metodo_estatico_y_de_instancia_us_002_2() -> None:
    """US-002.2: _calcular_restriccion es método estático y funciona en clase e instancia."""
    decreto = _crear_decreto(dias="0,1,2,3,4", digitos="3,4")
    fecha_hora = datetime(2026, 9, 28, 8, 0, tzinfo=ZONA_COLOMBIA)

    # Llamada directa en la clase
    res_clase = ConsultaService._calcular_restriccion("ABC123", decreto, fecha_hora)
    assert res_clase is True

    # Llamada a través de una instancia
    mock_db = AsyncMock()
    service = ConsultaService(mock_db)
    res_instancia = service._calcular_restriccion("ABC123", decreto, fecha_hora)
    assert res_instancia is True


def test_calcular_restriccion_latencia_menor_un_segundo_us_002_2() -> None:
    """US-002.2: La evaluación del algoritmo puro ejecuta 1.000 iteraciones en < 0.1 s."""
    import time as time_lib

    decreto = _crear_decreto(dias="0,1,2,3,4", digitos="3,4")
    fecha_hora = datetime(2026, 9, 28, 8, 0, tzinfo=ZONA_COLOMBIA)

    inicio = time_lib.perf_counter()
    for _ in range(1000):
        calcular_restriccion("ABC123", decreto, fecha_hora)
    duracion = time_lib.perf_counter() - inicio

    # 1.000 evaluaciones deben tomar mucho menos de 1 segundo (ej. < 0.1s)
    assert duracion < 0.1


@pytest.mark.asyncio
async def test_verificar_restriccion_sin_fecha_usa_ahora_colombia_us_002_2() -> None:
    """US-002.2: Si no se provee fecha_hora, usa la fecha y hora actual de Colombia."""
    db = AsyncMock()
    municipio = Municipio(id=1, nombre="Bogotá", departamento="Cundinamarca", codigo_dane="11001")
    db.get = AsyncMock(return_value=municipio)
    db.execute = AsyncMock(return_value=MagicMock(scalars=lambda: MagicMock(all=lambda: [])))
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    service = ConsultaService(db)
    # Sin fecha_hora enviada
    payload = ConsultaRequest(placa="ABC123", municipio_id=1)
    response = await service.verificar_restriccion(payload)

    assert response.fecha_hora_consultada is not None
    assert response.fecha_hora_consultada.tzinfo is not None


