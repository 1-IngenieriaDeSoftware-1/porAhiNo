# 🤝 Guía de Contribución — porAhiNo

> Bienvenido al equipo. Esta guía explica cómo trabajamos juntos con Git y GitHub.
> Léela completa antes de tu primer commit. Es más corta de lo que parece 😄

---

## 🚀 Primeros pasos: configura tu entorno local

### Prerequisitos

Antes de clonar el repo, asegúrate de tener instalado:

| Herramienta | Versión mínima | ¿Cómo verificar? |
|-------------|---------------|------------------|
| Git | 2.40+ | `git --version` |
| Node.js | 18 LTS+ | `node --version` |
| Python | 3.11+ | `python --version` |
| Docker Desktop | Última | `docker --version` |

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/1-IngenieriaDeSoftware-1/porAhiNo.git
cd porAhiNo
```

### Paso 2 — Levantar la base de datos (PostgreSQL con Docker)

```bash
# Desde la raíz del monorepo
docker-compose up -d
```

Esto levanta PostgreSQL en `localhost:5432`. Puedes verificarlo con:

```bash
docker ps   # deberías ver el contenedor "porAhiNo_db" corriendo
```

### Paso 3 — Configurar y levantar el Backend (FastAPI)

```bash
cd backend

# Copiar variables de entorno (edita el archivo .env con tus valores)
cp .env.example .env

# Crear entorno virtual de Python
python -m venv .venv

# Activar el entorno virtual
# Windows (PowerShell):
.venv\Scripts\activate
# Mac / Linux:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear las tablas en la base de datos (ejecutar migraciones)
alembic upgrade head

# Iniciar el servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

✅ El backend estará disponible en: http://localhost:8000
✅ Documentación interactiva (Swagger): http://localhost:8000/docs

### Paso 4 — Configurar y levantar el Frontend (Next.js)

```bash
# Abre una nueva terminal (deja el backend corriendo en la otra)
cd frontend

# Copiar variables de entorno
cp .env.example .env.local

# Instalar dependencias de Node
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

✅ El frontend estará disponible en: http://localhost:3000

---

## 🌿 Estrategia de ramas (GitHub Flow)

Usamos **GitHub Flow**: una sola rama protegida (`main`) y ramas de trabajo por tarea.

### Regla de oro ⚠️

> **Nunca hagas push directo a `main`.** Siempre trabaja en tu propia rama y abre un Pull Request.

### Convención de nombres de ramas

| Tipo de trabajo | Prefijo | Ejemplo |
|----------------|---------|--------|
| Nueva funcionalidad / historia de usuario | `feature/` | `feature/US-002-consulta-restriccion` |
| Corrección de bug | `fix/` | `fix/AC-002-validacion-placa-invalida` |
| Configuración / infraestructura | `chore/` | `chore/setup-ci-cd` |
| Documentación | `docs/` | `docs/actualizar-readme` |

**Formato:** `<tipo>/<ID>-<descripcion-corta-en-kebab-case>`

- El ID puede ser el de la historia de usuario (US-001) o del criterio de aceptación (AC-002)
- La descripción usa guiones medios, sin espacios, en minúsculas
- Máximo ~40 caracteres en total

---

## 🔄 Flujo de trabajo paso a paso

Este es el flujo que debes seguir para CADA tarea o historia de usuario:

### 1️⃣ Actualiza tu main local

Antes de crear una rama nueva, asegúrate de tener lo último de main:

```bash
git checkout main
git pull origin main
```

### 2️⃣ Crea tu rama de trabajo

```bash
git checkout -b feature/US-002-consulta-restriccion
```

### 3️⃣ Trabaja y haz commits frecuentes

Haz commits pequeños y descriptivos a medida que avanzas (ver convención abajo):

```bash
git add backend/app/services/consulta_service.py
git commit -m "feat: implementar logica de verificacion de digito US-002"
```

No esperes a tener todo listo para hacer el primer commit. Un commit por cambio lógico es lo ideal.

### 4️⃣ Sube tu rama al repositorio remoto

```bash
git push -u origin feature/US-002-consulta-restriccion
```

### 5️⃣ Abre un Pull Request en GitHub

1. Ve a https://github.com/1-IngenieriaDeSoftware-1/porAhiNo
2. GitHub te mostrará un botón amarillo *"Compare & pull request"* — haz clic
3. Completa la plantilla del PR (descripción, checklist, historia de usuario)
4. Asigna a un **compañero** como reviewer
5. Haz clic en **"Create pull request"**

### 6️⃣ Espera revisión y que el CI pase ✅

- El CI (GitHub Actions) correrá automáticamente el lint y el build
- Tu compañero revisará el código y dejará comentarios
- Si hay cambios pedidos, hazlos en tu misma rama y haz push (el PR se actualiza solo)

```bash
# Haz los cambios que te pidió el revisor, luego:
git add .
git commit -m "fix: corregir validacion de placa segun revision PR"
git push origin feature/US-002-consulta-restriccion
```

### 7️⃣ Mergear cuando esté listo

Cuando el CI pase 🟢 y haya al menos 1 aprobación, el PR puede mergearse.

> **¿Quién mergea?** Cualquiera del equipo puede mergear el PR una vez que está aprobado.
> La convención es que lo mergea el autor del PR o el revisor si el autor ya dio el OK.

Usa **"Squash and merge"** para mantener el historial de `main` limpio.

### 8️⃣ Limpia tu rama local

Después de mergear, elimina la rama para no acumular ramas viejas:

```bash
git checkout main
git pull origin main
git branch -d feature/US-002-consulta-restriccion
```

---

## ✍️ Convención de Commits (Conventional Commits)

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para que el historial sea legible:

```
<tipo>: <descripción corta en imperativo>
```

### Tipos permitidos

| Tipo | ¿Cuándo usarlo? |
|------|----------------|
| `feat:` | Agrega una nueva funcionalidad |
| `fix:` | Corrige un bug |
| `docs:` | Cambios solo en documentación |
| `chore:` | Tareas de configuración, dependencias, CI |
| `test:` | Agrega o corrige tests |
| `refactor:` | Refactoriza código sin cambiar comportamiento |
| `style:` | Formato, espacios, punto y coma (sin cambios de lógica) |

### Ejemplos concretos del proyecto

```bash
# Implementar una historia de usuario
git commit -m "feat: agregar validacion de placa colombiana US-001"

# Corregir un bug
git commit -m "fix: corregir calculo de restriccion en horario nocturno AC-003"

# Agregar un test
git commit -m "test: agregar prueba unitaria para ConsultaService US-002"

# Documentación
git commit -m "docs: actualizar README con instrucciones de despliegue"

# Configuración de CI
git commit -m "chore: agregar workflow de GitHub Actions para frontend"

# Actualizar dependencias
git commit -m "chore: actualizar next a version 14.2.3"
```

### Reglas

- Usa **imperativo** en la descripción: "agregar" no "agregué", "corregir" no "corrijo"
- Máximo **72 caracteres** en la primera línea
- Si necesitas más detalle, deja una línea en blanco y escribe debajo
- **No** uses tildes ni caracteres especiales en el tipo (el tipo siempre en inglés)

---

## ❓ Preguntas frecuentes

**¿Puedo hacer commit directo a main?**
No. Las reglas de protección de rama lo impiden. Siempre crea una rama y abre un PR.

**¿Qué hago si mi rama tiene conflictos con main?**
```bash
git checkout feature/mi-rama
git pull origin main          # trae los cambios de main a tu rama
# resuelve los conflictos en tu editor
git add .
git commit -m "chore: resolver conflictos con main"
git push origin feature/mi-rama
```

**¿Cuántos commits debo hacer antes de subir el PR?**
Los que necesites. Commits frecuentes y pequeños son mejor que un commit gigante al final.

**¿Qué hago si el CI falla en mi PR?**
Lee el log de GitHub Actions (en la pestaña "Checks" del PR), corrije el problema en tu rama
y haz push. El CI se ejecutará de nuevo automáticamente.

---

## 📞 Dudas del equipo

Si tienes dudas sobre el flujo, pregunta en el canal del equipo antes de hacer algo que
pueda romper `main`. Es mejor preguntar que lamentar. 🙌
