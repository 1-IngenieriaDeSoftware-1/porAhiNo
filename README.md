# porAhiNo

PWA para consultar **Pico y Placa** en Colombia. El conductor indica placa y municipio y recibe, en menos de un segundo (objetivo SRS), si hay restricción activa.

Repositorio: [1-IngenieriaDeSoftware-1/porAhiNo](https://github.com/1-IngenieriaDeSoftware-1/porAhiNo)  
Board: [Projects / porAhiNo](https://github.com/orgs/1-IngenieriaDeSoftware-1/projects/1)

---

## Qué resuelve

En ciudades como Medellín, Bogotá y Cali las reglas cambian por municipio, tipo de vehículo, horario y dígito de placa. porAhiNo centraliza esa consulta para reducir infracciones no intencionadas.

**Dentro del alcance:** registro de vehículos, consulta en tiempo real, gestión de decretos por el administrador, alertas en Release 2.

**Fuera del alcance:** GPS, pago de multas, cámaras, SIMIT.

Documento de requisitos: `Levantamiento_de_Requisitos_porAhiNo` (SRS v1.0). Cómo está armado el código: [`docs/ESTRUCTURA.md`](docs/ESTRUCTURA.md). Cómo contribuir: [`README-CONTRIBUTING.md`](README-CONTRIBUTING.md).

---

## Arquitectura

```
porAhiNo/
├── frontend/          Next.js 14 PWA (App Router)
├── backend/           FastAPI + SQLAlchemy async
├── docs/              Arquitectura y cambios de estructura
└── docker-compose.yml PostgreSQL 16 local
```

| Capa | Tecnología | Rol |
|------|------------|-----|
| Presentación | Next.js 14, TypeScript, Tailwind | UI, PWA, consumo de `/api/v1` |
| Aplicación | FastAPI, Pydantic | Validación, JWT, reglas de negocio |
| Datos | PostgreSQL | Única persistencia; el frontend no habla con la BD |

Flujos del SRS:

| ID | Historia | Release | Dónde vive |
|----|----------|---------|------------|
| US-001 | Registrar placa / tipo | R1 Must | `/vehiculos`, `POST /api/v1/vehiculos` |
| US-002 | Consultar pico y placa | R1 Must | `/consulta`, `POST /api/v1/consulta` |
| US-003 | Listar municipios | R1 Should | mismo módulo consulta |
| US-004 | Actualizar calendario | R1 Must | `/admin`, `/api/v1/admin` |
| US-005 | Recordatorio | R2 Could | `/alertas` (cascarón) |
| US-006 | Varios vehículos | R2 Should | mismo módulo vehículos |

La consulta (US-002) es **pública**. Guardar vehículos y administrar decretos requieren JWT.

---

## Arranque local

**Requisitos:** Node.js 18+, Python 3.11+, Docker Desktop, Git.

La base de datos **solo corre en un contenedor local**. No hay Postgres en la nube todavía: se desplegará cuando el producto esté casi listo.

```bash
git clone https://github.com/1-IngenieriaDeSoftware-1/porAhiNo.git
cd porAhiNo
docker compose up -d
```

PostgreSQL queda en `127.0.0.1:5432` (usuario `porAhiNo_user`, clave `porAhiNo_pass`, bd `porAhiNo_db`).

### Backend

```bash
cd backend
cp .env.example .env
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

# US-DB-01 — esquema (espera a que el contenedor esté healthy)
python -m scripts.migrate
# equivalente: alembic upgrade head
# revertir: alembic downgrade base

uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000  
- OpenAPI: http://localhost:8000/docs  
- Catálogo de municipios (seed): siguiente historia US-DB-02

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000  
Consulta en 2 clics desde home: **Consultar restricción** → **Verificar estado**.

---

## API (v1)

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

Contrato de consulta: placa colombiana (`ABC123` o `ABC12D`) + `municipio_id`. Placa inválida → 422 (AC-002).

---

## Calidad y no funcionales (ISO/IEC 25010)

| ID | Objetivo | Cómo se sostiene en la base |
|----|----------|-----------------------------|
| REQ-NFUNC-001 | Latencia consulta &lt; 1 s | Async + índice `ix_decretos_municipio_vigencia` |
| REQ-NFUNC-003 | Bcrypt | `app/core/security.py` |
| REQ-NFUNC-004 | HTTPS / TLS 1.3 | Headers HSTS en Next.js; TLS en Vercel |
| REQ-NFUNC-005 | 360px–1920px | Tailwind `xs`–`3xl`, menú hamburguesa |
| REQ-NFUNC-006 | ≤ 3 clics a consultar | Home → Consultar → Verificar |
| Ley 1581 | Datos mínimos | `/privacidad`, hash de contraseña, consulta anónima |

```bash
# backend
cd backend && pytest tests/ -v && ruff check app/

# frontend
cd frontend && npm run lint && npm run type-check && npm run build
```

CI: `.github/workflows/backend-ci.yml` y `frontend-ci.yml`.

---

## Despliegue

| Pieza | Plataforma prevista |
|-------|---------------------|
| Frontend | Vercel |
| Backend | Render / Railway |
| Base de datos | Neon / PostgreSQL gestionado |

Capa gratuita acorde a la restricción académica del SRS.

---

## Equipo

Organización `1-IngenieriaDeSoftware-1`. Flujo Git: GitHub Flow sobre `main` protegida. Detalle en `README-CONTRIBUTING.md`.
