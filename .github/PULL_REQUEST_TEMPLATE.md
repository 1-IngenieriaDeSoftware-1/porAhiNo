## 📋 Descripción del cambio

<!-- Explica QUÉ cambiaste y POR QUÉ. Sé específico. -->
<!-- Ejemplo: "Implementa el endpoint POST /api/v1/consulta que verifica restricción de Pico y Placa" -->

...

## 🔗 Historia de usuario / Requisito relacionado

<!-- Escribe el ID de la historia de usuario o requisito que implementa este PR -->
<!-- Ejemplos: US-001, US-002, REQ-FUNC-002, fix/AC-002 -->

Relacionado con: <!-- US-XXX / fix #issue -->

## 🧪 ¿Cómo probarlo?

<!-- Pasos para que el revisor pueda probar tu cambio en local -->

1. ...
2. ...
3. ...

## ✅ Checklist

> Marca con una `x` dentro de los corchetes: `[x]`

### Calidad del código
- [ ] El código compila sin errores
- [ ] No hay errores de **lint** (ESLint para frontend / Ruff para backend)
- [ ] No hay warnings nuevos que no estuviesen antes

### Tests
- [ ] Los **tests existentes** siguen pasando
- [ ] Agregué tests nuevos para el código que implementé (si aplica)
- [ ] Probé el cambio **en mi máquina local** con el flujo completo (frontend + backend + DB)

### Integración
- [ ] Mi rama está **actualizada con `main`** (`git pull origin main` antes del PR)
- [ ] No hay conflictos de merge
- [ ] Las variables de entorno nuevas están documentadas en `.env.example`

### Documentación
- [ ] Actualicé el `README.md` si agregué algo que el equipo necesita saber
- [ ] Los comentarios en el código son claros y en español (o inglés consistente)
- [ ] Si agregué un endpoint nuevo, está documentado en los docstrings del router

## 📸 Capturas de pantalla (si aplica)

<!-- Si es un cambio visual en el frontend, agrega una captura antes/después -->
<!-- Puedes arrastrar imágenes directamente aquí -->

| Antes | Después |
|-------|--------|
| ...   | ...    |

## 💬 Notas para el revisor

<!-- ¿Hay algo específico que quieres que tu compañero revise con atención? -->
<!-- ¿Alguna decisión de diseño que tomaste y quieres discutir? -->

...
