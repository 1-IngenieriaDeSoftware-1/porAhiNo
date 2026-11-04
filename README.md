# porAhiNo

PWA para consultar **Pico y Placa** en Colombia. El conductor indica placa y municipio y recibe, en menos de un segundo (objetivo SRS), si hay restricción activa.

Repositorio: [1-IngenieriaDeSoftware-1/porAhiNo](https://github.com/1-IngenieriaDeSoftware-1/porAhiNo)  
Tablero: [Projects / porAhiNo](https://github.com/orgs/1-IngenieriaDeSoftware-1/projects/1)

Especificación OpenAPI: [`openapi.yaml`](openapi.yaml) (OpenAPI 3.0.3). En runtime también en http://localhost:8000/docs

---

## Integrantes

| Nombre | GitHub |
|--------|--------|
| Daniel Montiel | [Daniel_Montiel](https://github.com/Daniel_Montiel) / [Daniel73636](https://github.com/Daniel73636) |
| Edward Molina Mazo | [Axe-major](https://github.com/Axe-major) |
| J. Torres | [JTorres1407](https://github.com/JTorres1407) |

---

## Tecnologías

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | Next.js (App Router) + TypeScript + Tailwind | 14.2.3 |
| Backend | FastAPI + Uvicorn + SQLAlchemy async + Alembic | FastAPI 0.111.0 · Python 3.11 |
| Base de datos | PostgreSQL gestionado (Clever Cloud) | 16.x |
| Contenedores | Docker Compose (solo API + PWA) | Compose V2 |

---

## Arranque con Docker (entrega)

**Requisitos:** Docker Desktop (o Engine + Compose V2). La base de datos **no** corre en Compose: está desplegada en la nube.

1. Crear en la raíz del clon el archivo `.env` con las credenciales de la BD (el equipo las envía en el correo de entrega; plantilla: [`.env.example`](.env.example)):

```bash
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=...
DB_NAME=...
```

2. Levantar backend y frontend:

```bash
git clone https://github.com/1-IngenieriaDeSoftware-1/porAhiNo.git
cd porAhiNo
# crear .env (paso 1)
docker compose up -d --build
```

Tras el arranque (migraciones + seed automáticos en el contenedor del backend):

| Servicio | URL |
|----------|-----|
| Frontend (PWA) | http://localhost:3000 |
| API | http://localhost:8000 |
| OpenAPI interactivo | http://localhost:8000/docs |
| Spec versionada | `openapi.yaml` (raíz del repo) |

Comprobar: `docker compose ps` (backend healthy, frontend running).  
Detener: `docker compose down`.

### Variables de entorno

Compose declara la URL de conexión así:

- `DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?ssl=require`
- `DATABASE_URL_SYNC=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require`

| Variable | Default | Notas |
|----------|---------|-------|
| `DB_USER` | _(ninguno)_ | Obligatorio en `.env` — no versionado |
| `DB_PASSWORD` | _(ninguno)_ | Obligatorio en `.env` — no versionado |
| `DB_HOST` | _(ninguno)_ | Obligatorio en `.env` — no versionado |
| `DB_PORT` | _(ninguno)_ | Obligatorio en `.env` — no versionado |
| `DB_NAME` | _(ninguno)_ | Obligatorio en `.env` — no versionado |
| `SECRET_KEY` | `porahino-dev-secret-change-me-in-production` | JWT |
| `ALGORITHM` | `HS256` | JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT |
| `ALLOWED_ORIGINS` | `["http://localhost:3000"]` | CORS |
| `ENVIRONMENT` | `development` | |
| `DEBUG` | `true` | Expone `/docs` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Build del frontend |

### Usuarios y datos de prueba

Al primer `docker compose up` el backend migra el esquema y carga seeds (idempotente) sobre la BD en la nube:

**Admins**

| Correo | Contraseña |
|--------|------------|
| `admin@porahino.co` | `Admin1234` |
| `admin2@porahino.co` | `Admin1234` |

**Conductores:** `conductor1@porahino.co` … `conductor8@porahino.co` / `Conductor123`

**Datos:** municipios Bogotá, Medellín y Cali con decretos de rotación Pico y Placa para recorrer consulta (US-002), vehículos (US-001/006) y panel admin (US-004) sin crear datos a mano.

Flujos sugeridos:

1. http://localhost:3000 → **Consultar restricción** → placa `ABC123` + municipio sembrado.
2. Login conductor → registrar / listar vehículos.
3. Login admin → gestionar decretos en `/admin`.

---

## Qué resuelve

En ciudades como Medellín, Bogotá y Cali las reglas cambian por municipio, tipo de vehículo, horario y dígito de placa. porAhiNo centraliza esa consulta para reducir infracciones no intencionadas.

**Dentro del alcance:** registro de vehículos, consulta en tiempo real, gestión de decretos por el administrador, alertas en Release 2.

**Fuera del alcance (SRS R1):** GPS, pago de multas, cámaras, SIMIT.

Documento de requisitos: `Levantamiento_de_Requisitos_porAhiNo` (SRS v1.0). Estructura del código: [`docs/ESTRUCTURA.md`](docs/ESTRUCTURA.md). Contribución: [`README-CONTRIBUTING.md`](README-CONTRIBUTING.md).

### Flujos del SRS

| ID | Historia | Release | Dónde vive |
|----|----------|---------|------------|
| US-001 | Registrar placa / tipo | R1 Must | `/vehiculos`, `POST /api/v1/vehiculos` |
| US-002 | Consultar pico y placa | R1 Must | `/consulta`, `POST /api/v1/consulta` |
| US-003 | Listar municipios | R1 Should | `GET /api/v1/consulta/municipios` |
| US-004 | Actualizar calendario | R1 Must | `/admin`, `/api/v1/admin` |
| US-005 | Recordatorio | R2 Could | `/alertas` (cascarón) |
| US-006 | Varios vehículos | R2 Should | mismo módulo vehículos |

La consulta (US-002) es **pública**. Guardar vehículos y administrar decretos requieren JWT.

---

## Arranque local del backend (opcional, sin Compose de app)

Con la misma BD en la nube (o un Postgres local tuyo), puedes correr API/FE en el host:

```bash
cd backend
cp .env.example .env   # rellenar DATABASE_URL / DATABASE_URL_SYNC
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python -m scripts.migrate
python -m scripts.seed_pruebas
python -m scripts.seed_demo_usuarios
uvicorn app.main:app --reload --port 8000

cd frontend && cp .env.example .env.local && npm install && npm run dev
```

---

## API (v1)

Contrato completo: [`openapi.yaml`](openapi.yaml).

| Método | Ruta | Auth | Historia |
|--------|------|------|----------|
| POST | `/api/v1/auth/register` | No | Cuenta conductor |
| POST | `/api/v1/auth/login` | No | JWT |
| GET | `/api/v1/auth/me` | Bearer | Perfil |
| POST | `/api/v1/consulta/` | No | US-002 |
| GET | `/api/v1/consulta/municipios` | No | US-003 |
| CRUD | `/api/v1/vehiculos` | Bearer | US-001 / US-006 |
| CRUD | `/api/v1/admin/decretos` | Bearer + admin | US-004 |
| GET | `/api/v1/health` | No | Monitoreo |

Contrato de consulta: placa colombiana (`ABC123` o `ABC12D`) + `municipio_id`. Placa inválida → 422.

---

## Calidad

```bash
cd backend && pytest tests/ -v && ruff check app/
cd frontend && npm run lint && npm run type-check && npm run build
```

CI: `.github/workflows/backend-ci.yml` y `frontend-ci.yml`.

---

## Equipo y flujo

Organización `1-IngenieriaDeSoftware-1`. GitHub Flow sobre `main` protegida. Detalle en `README-CONTRIBUTING.md`.
