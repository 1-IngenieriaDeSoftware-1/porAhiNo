# porAhiNo — Android (Capacitor)

Rama: **`feat/android-app`**. Empaqueta el frontend Next.js (export estático) en un WebView nativo con Capacitor 6.

## Requisitos

- Node 20+
- JDK 17+ (Android Gradle Plugin actual; Java 8 del sistema **no** alcanza para compilar)
- Android Studio Ladybug+ con SDK 34 y platform-tools
- Backend FastAPI accesible desde el dispositivo/emulador

## Flujo rápido

```bash
cd frontend
npm install

# API que verá la app (emulador → host machine)
# Windows PowerShell:
$env:NEXT_PUBLIC_API_URL="http://10.0.2.2:8000/api/v1"

npm run build:android   # next export → out/ + cap sync
npm run android:open    # abre Android Studio
```

En Android Studio: **Run** en emulador o dispositivo USB (debug).

## API desde el teléfono físico

`10.0.2.2` solo funciona en el emulador. En un móvil real usa la IP LAN del PC, p. ej.:

```text
NEXT_PUBLIC_API_URL=http://192.168.1.20:8000/api/v1
```

El backend debe escuchar en `0.0.0.0:8000` y CORS incluir el origen Capacitor (`https://localhost` con `androidScheme`).

## Cleartext HTTP (solo debug)

Si apuntas a `http://…`, Android bloquea cleartext. Tras `cap add android`, en `android/app/src/main/AndroidManifest.xml` el template ya permite mixed content vía Capacitor; si falla, añade `android:usesCleartextTraffic="true"` en `<application>` **solo en builds debug**.

## Geolocalización

`NavegacionMap` usa `@capacitor/geolocation` en nativo y `navigator.geolocation` en web. Declara permisos (Capacitor los inyecta al sync):

- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`

## APK release

1. Genera un keystore (no lo subas al repo).
2. Configura `android/app/keystore.properties` (gitignored vía `*.keystore`).
3. Build → Generate Signed Bundle / APK en Android Studio.

## Relación con MainV2

Incluye navegación MapLibre, zonas densificadas y desvíos OSRM. El shell Android no cambia la lógica de negocio: consume `/api/v1/*` igual que la PWA.
