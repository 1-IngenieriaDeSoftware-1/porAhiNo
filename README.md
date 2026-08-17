# 🚗 porAhiNo — Consulta de Pico y Placa en Colombia

> PWA que permite a conductores consultar restricciones de Pico y Placa por municipio, placa y fecha/hora en tiempo real.

## 📁 Arquitectura del Monorepo

```
porAhiNo/
├── frontend/          # Next.js 14 PWA (Vercel)
├── backend/           # FastAPI REST API (Render/Railway)
└── docker-compose.yml # PostgreSQL local para desarrollo
```

### Capas arquitectónicas

| Capa | Tecnología | Responsabilidad |
|------|-----------|----------------|
| Presentación | Next.js 14 + TypeScript | UI/UX, consumo de API REST |
| Aplicación | FastAPI + Python | Lógica de negocio, API REST |
| Datos | PostgreSQL | Persistencia exclusiva vía backend |

## 🚀 Instalación local

### Prerrequisitos
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/porAhiNo.git
cd porAhiNo
```

### 2. Levantar PostgreSQL con Docker

```bash
docker-compose up -d
```

PostgreSQL estará disponible en `localhost:5432`.

### 3. Configurar el Backend (FastAPI)

```bash
cd backend
cp .env.example .env       # Editar con tus valores
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

API disponible en: `http://localhost:8000`  
Docs interactiva: `http://localhost:8000/docs`

### 4. Configurar el Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local  # Editar con tus valores
npm install
npm run dev
```

Frontend disponible en: `http://localhost:3000`

## 🌐 Despliegue en Producción

| Servicio | Plataforma | URL |
|----------|-----------|-----|
| Frontend | Vercel | https://por-ahi-no.vercel.app |
| Backend | Render / Railway | https://api.porAhiNo.com |
| Database | Neon / Railway PostgreSQL | (interna) |

## 📚 Módulos funcionales

- **US-001 / US-006** — Registro y gestión de vehículos
- **US-002 / US-003** — Consulta de restricción en tiempo real
- **US-004** — Panel de administración de decretos/calendarios
- **US-005** — Módulo de alertas preventivas *(Release 2)*

## 🔒 Seguridad & Cumplimiento

- Contraseñas con Bcrypt (passlib)
- Comunicación HTTPS/TLS 1.3
- JWT para autenticación de admins
- Cumplimiento **Ley 1581 de 2012** (protección de datos personales Colombia)

## 📄 Licencia

MIT
