# 🔒 Configuración de Reglas de Protección de Rama — main

> **¿Quién debe hacer esto?**
> El integrante del equipo que tenga rol de **Owner o Admin** en la organización
> `1-IngenieriaDeSoftware-1` en GitHub.
>
> **¿Cuándo hacerlo?**
> DESPUÉS de que el Pull Request `chore/setup-ci-cd` haya sido mergeado a `main`.
> Si configuras las protecciones ANTES de mergear ese PR, el CI no existirá todavía
> y el sistema bloqueará el merge.

---

## Paso a paso

### 1. Ir a la configuración del repositorio

1. Abre el repositorio en GitHub:
   https://github.com/1-IngenieriaDeSoftware-1/porAhiNo
2. Haz clic en la pestaña **"Settings"** (ícono de engranaje, arriba a la derecha)
3. En el menú lateral izquierdo, haz clic en **"Branches"**

---

### 2. Crear una nueva regla de protección

1. Haz clic en el botón **"Add branch protection rule"**
   (o "Add classic branch protection rule" si aparece esa opción)
2. En el campo **"Branch name pattern"** escribe exactamente:
   ```
   main
   ```

---

### 3. Configurar las opciones de protección

Activa las siguientes opciones una por una:

#### ✅ Requerir Pull Request antes de mergear

- Marca la casilla: **"Require a pull request before merging"**
- Dentro de esa sección, configura:
  - **"Required number of approvals"**: cambia a **1**
  - Marca **"Dismiss stale pull request approvals when new commits are pushed"**

    > Esto invalida la aprobación anterior si alguien hace push de nuevos commits,
    > forzando una nueva revisión. Evita que se apruebe código y luego se cambie
    > antes de mergear.

#### ✅ Requerir que los checks de CI pasen antes de mergear

- Marca la casilla: **"Require status checks to pass before merging"**
- Marca también: **"Require branches to be up to date before merging"**

  > Esto evita que se mergee código que no haya sido probado con la versión
  > más reciente de main.

- En el buscador que aparece, busca y agrega los siguientes checks:
  - `Lint & Build`          ← del workflow frontend-ci
  - `Lint, Test & Verify`   ← del workflow backend-ci

  > **Nota importante:** Estos checks solo aparecen en el buscador DESPUÉS de que
  > hayan corrido al menos una vez en un PR. Si no aparecen todavía:
  > 1. Cierra esta pantalla sin guardar
  > 2. Abre cualquier PR que toque /frontend o /backend para que el CI corra
  > 3. Regresa aquí y busca los checks nuevamente

#### ✅ Prohibir push directo a main

- Deja activada la opción **"Do not allow bypassing the above settings"**
  (si aparece marcada por defecto, no la desmarques)
- Si aparece **"Restrict who can push to matching branches"**, deja la lista vacía
  (nadie puede hacer push directo, ni los admins)

#### ✅ No permitir forzar push ni borrar la rama

- Asegúrate de que **"Allow force pushes"** esté DESACTIVADO (sin marca)
- Asegúrate de que **"Allow deletions"** esté DESACTIVADO (sin marca)

  > Esto evita que alguien borre la rama main por accidente.

---

### 4. Guardar la configuración

1. Desplázate hasta el final de la página
2. Haz clic en el botón verde **"Create"**
   (o **"Save changes"** si estás editando una regla existente)

---

## Verificación

Para confirmar que las reglas funcionan correctamente:

1. Intenta hacer push directo a main desde tu máquina local:

   ```bash
   git checkout main
   echo "test" >> README.md
   git add README.md
   git commit -m "test: verificar proteccion de rama"
   git push origin main
   ```

   → GitHub debe **rechazar** el push con el mensaje:
   `remote: error: GH006: Protected branch update failed`

2. Revierte el commit de prueba inmediatamente:

   ```bash
   git reset --hard HEAD~1
   ```

---

## Resumen de reglas activadas

| Regla | Configuración |
|-------|---------------|
| Pull Request requerido | Sí, mínimo **1 aprobación** |
| Aprobaciones invalidadas en nuevo push | Sí |
| CI debe pasar | Sí: `Lint & Build` + `Lint, Test & Verify` |
| Rama debe estar actualizada con main | Sí |
| Push directo a main | ❌ Prohibido |
| Force push | ❌ Prohibido |
| Borrar rama main | ❌ Prohibido |

---

## ¿Qué pasa si necesitamos hacer un hotfix urgente en producción?

En situaciones excepcionales, el flujo es:

1. Crear una rama `fix/hotfix-descripcion` desde main
2. Hacer los cambios mínimos necesarios
3. Abrir un PR express y pedir revisión urgente a un compañero
4. Mergear en cuanto esté aprobado y el CI pase

**Nunca** se debe desactivar la protección de rama para hacer un hotfix.
El proceso de PR existe precisamente para que dos personas vean el cambio
antes de que llegue a producción.
