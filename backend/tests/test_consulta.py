"""
Tests: Servicio de consulta de Pico y Placa (US-002).

Cuando ConsultaService._calcular_restriccion esté listo, cubrir:
- Placa restringida en horario → tiene_restriccion=True (AC-003)
- Placa sin restricción → False (AC-004)
- Fin de semana / fuera de horario → False
- Municipio sin decreto activo → False
"""
