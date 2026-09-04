# Estructura de porAhiNo

Este documento describe **qué había** en el monorepo, **qué se cambió** para alinear la base con el SRS (`Levantamiento_de_Requisitos_porAhiNo`, v1.0) y **qué sigue pendiente** en las historias de usuario.

No sustituye el SRS: aquí solo se habla de código.

---

## 1. Qué había (antes de esta mejora)

El repo ya era un monorepo con la forma correcta en papel:

- `frontend/`: Next.js 14 App Router, Tailwind, PWA (`next-pwa`), cliente Axios.
- `backend/`: FastAPI, SQLAlchemy async, Alembic, Pydantic, JWT/Bcrypt.
- `docker-compose.yml`: PostgreSQL 16.

Las **capas** (routers → services → models/schemas) existían como archivos, pero no como sistema:

| Problema | Efecto |
|----------|--------|
| Routers devolvían `501` a mano y no llamaban a los services | La API no tenía un solo camino HTTP → dominio |
| Services con `NotImplementedError` vacío | El cliente no sabía *qué* historia faltaba |
| Navbar y Footer no se usaban en `layout` | Cada página era un HTML suelto; no había app shell |
| Tipos duplicados en cada `*Service.ts` y en `types/api.ts` | Contratos frontend/backend fáciles de desfasar |
| Validación de placa copiada en schema de vehículo, no en consulta | AC-001/AC-002 no se aplicaban al flujo principal |
| `ALLOWED_ORIGINS` como lista sin parser | El `.env` con orígenes separados por coma no cargaba bien |
| Alembic `env.py` usaba motor **async** con URL **sync** | `alembic upgrade` no era usable |
| Cero revisiones en `alembic/versions/` | No había esquema versionado |
| Consulta guardaba `municipio_destino` como texto | Sin FK al catálogo de municipios |
| `/civica` (propuesta Metro) mezclada con Pico y Placa | Ruido respecto al alcance del SRS |
| README con URL de clone genérica y módulos no mapeados al board | Onboarding incompleto |

La lógica de negocio de US-002/US-004 **no estaba implementada** (y sigue sin estarlo a propósito: esta pasada es de estructura, no de algoritmo de Pico y Placa).

---

## 2. Qué se cambió

### 2.1 Backend

```
backend/app/
├── core/           # Núcleo compartido (nuevo o reforzado)
│   ├── placa.py    # AC-001 / AC-002, sin I/O
│   ├── timezone.py # America/Bogota
│   ├── deps.py     # JWT, require_admin
│   ├── exceptions.py
│   ├── security.py
│   ├── config.py   # CORS CSV + pydantic-settings v2
│   └── database.py
├── routers/        # Delgados: HTTP + Depends + service
├── services/       # Auth implementado; resto 501 con mensaje US-xxx
├── models/         # + Alerta (R2), Consulta.municipio_id FK
└── schemas/        # + Municipio; placa unificada
```

- **Auth de verdad** (`AuthService` + `POST /register|/login` + `GET /me`): es infraestructura de US-001 y US-004, no una historia extra.
- Consulta **pública**; vehículos con Bearer; admin con Bearer + rol `admin`.
- `NotImplementedError` → HTTP 501 con texto de la historia (handler global).
- Migración `001_initial` (usuarios, municipios, decretos, vehiculos, consultas, alertas) e índice `ix_decretos_municipio_vigencia` (REQ-NFUNC-001).
- Seed: Bogotá, Medellín, Cali + admin `admin@porahino.co`.
- Tests de placa en `backend/tests/test_placa.py` (corren sin PostgreSQL).
- Alembic online con `create_engine` síncrono.

### 2.2 Frontend

```
frontend/src/
├── app/
│   ├── layout.tsx          # html + AuthProvider
│   ├── (app)/              # AppShell: Navbar + Footer (rutas del producto)
│   │   ├── page.tsx        # Home → CTA consulta (REQ-NFUNC-006)
│   │   ├── consulta/       # Formulario + resultado (US-002)
│   │   ├── vehiculos/      # Requiere sesión
│   │   ├── admin/          # Requiere rol admin
│   │   ├── alertas/        # Placeholder R2
│   │   ├── auth/           # login + register
│   │   └── privacidad/     # Ley 1581
│   └── civica/             # Aislada, fuera del AppShell
├── components/layout/      # AppShell, Navbar (móvil), Footer
├── components/consulta/    # Form, Resultado, View
├── providers/AuthProvider.tsx
├── lib/placa.ts            # Mismo contrato que el backend
├── lib/routes.ts
└── types/api.ts            # Única fuente de tipos de API
```

- Navbar responsive (REQ-NFUNC-005). Admin solo si `rol === admin`.
- `ConsultaForm` valida placa en cliente (AC-002) y llama al hook `useConsulta`.
- Cliente Axios adjunta JWT y limpia token en 401, **sin** redirigir: la consulta sigue siendo usable anónima.

### 2.3 Documentación

- `README.md` reescrito: clone real, arranque, tabla SRS ↔ código, NFR.
- Este archivo: estado anterior vs. actual.

---

## 3. Qué no se implementó (a propósito)

Estas piezas **sí** tienen ruta, schema y service; falta la regla de negocio:

| Historia | Falta |
|----------|--------|
| US-002 / AC-003 / AC-004 | `ConsultaService.verificar_restriccion` y `_calcular_restriccion` |
| US-003 | `get_municipios_activos` (JOIN decretos vigentes) |
| US-001 / US-006 | CRUD en `VehiculoService` |
| US-004 / AC-005 | CRUD decretos; al guardar, las consultas siguientes deben ver el cambio sin reiniciar |
| US-005 | Scheduler + push (Release 2) |

Criterio para implementar US-002: función pura `_calcular_restriccion(placa, decreto, fecha_hora)` testeable, usando `ultimo_digito()` y `ahora_colombia()`.

---

## 4. Mapa rápido de archivos por historia

| Historia | Frontend | Backend |
|----------|----------|---------|
| US-001 | `(app)/vehiculos`, `vehiculosService.ts` | `routers/vehiculos.py`, `services/vehiculo_service.py` |
| US-002 | `(app)/consulta`, `ConsultaView` | `routers/consulta.py`, `consulta_service.py` |
| US-003 | select de municipios en `ConsultaForm` | `GET /consulta/municipios` |
| US-004 | `(app)/admin` | `routers/admin.py`, `require_admin` |
| US-005 | `(app)/alertas` | `models/alerta.py` |
| US-006 | misma superficie que US-001 | mismo service, N vehículos por usuario |

---

## 5. Notas de alcance

- `/civica` no está en el SRS de porAhiNo. Se dejó como landing aparte para no borrar trabajo ajeno.
- El token JWT en `localStorage` es suficiente para el entorno académico; en producción conviene cookie HttpOnly.
