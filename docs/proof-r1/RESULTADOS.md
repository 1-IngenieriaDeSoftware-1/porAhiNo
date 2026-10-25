# Pruebas R1 — resultados (2026-10-25)

Evidencia en capturas `01`–`05`. Stack: Postgres Docker + API `:8000` + Next `:3000`.

## Automático
- Backend `pytest`: **87 passed**, 21 skipped
- Frontend `tsc --noEmit`: OK
- Latencia consulta API (warm): **~20 ms** (cold start ~2 s)
- Placa inválida → **422**
- Conductor sin rol admin → **403** en `/admin/decretos`
- Conductor puede registrar **2 vehículos** (US-006)

## Manual / UI (navegador)
| # | Caso | Resultado |
|---|------|-----------|
| 01 | Formulario consulta + municipios activos | OK |
| 02 | Verificar ABC211 / Bogotá → sin restricción (domingo) | OK |
| 03 | Mapa US-003.3 con 3 municipios | OK |
| 04 | Login admin → panel decretos; nav sin “Mis vehículos” | OK |
| 05 | Desactivar → modal propio (no confirm nativo) | OK |
| — | `/privacidad` Ley 1581 | OK |
| — | `/alertas` solo cascarón R2 | Esperado |

## Mejoras / deuda
1. Quitar IDs de historia (US-00x) del copy visible al usuario.
2. Primera consulta fría ~2 s; warm OK — calentar API o medir en CI.
3. CTA “Consultar restricción” del home a veces no navega en automatización (usar nav Consultar).
4. US-005 Alertas: no implementado (R2 Could) — no marcar como fallo R1.
5. Epics/issues del board aún abiertos aunque funcionalidad R1 esté en código.
6. No se pudo grabar video real de UI con cursor (herramienta de video es IA, no screencast).
