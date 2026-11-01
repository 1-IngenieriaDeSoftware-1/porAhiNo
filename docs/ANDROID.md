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

## API desde el emulador y desde un teléfono físico

- **Emulador Android:** `10.0.2.2` es el alias del `localhost` del PC anfitrión. Úsalo como
  `NEXT_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1`. En el navegador del PC **no** funciona
  (`apiClient` lo reemplaza por `http://localhost:8000/api/v1` fuera de Capacitor).
- **Teléfono físico:** `10.0.2.2` no existe; usa la IP LAN del PC, p. ej.:

```text
NEXT_PUBLIC_API_URL=http://192.168.1.20:8000/api/v1
```

El backend debe escuchar en `0.0.0.0:8000` y CORS incluir el origen Capacitor (`https://localhost` con `androidScheme`).

Timeouts opcionales: `NEXT_PUBLIC_API_TIMEOUT_MS` (global, 60 s) y `NEXT_PUBLIC_RECALC_TIMEOUT_MS`
(recálculo en ruta, 10 s).

## Cleartext HTTP (solo debug)

Si apuntas a `http://…`, Android bloquea cleartext. Tras `cap add android`, en `android/app/src/main/AndroidManifest.xml` el template ya permite mixed content vía Capacitor; si falla, añade `android:usesCleartextTraffic="true"` en `<application>` **solo en builds debug**.

## Geolocalización

La navegación usa **una sola fuente de posición**: el hook `useGpsTracking`
(`frontend/src/hooks/useGpsTracking.ts`, utilidades puras en `frontend/src/lib/gps.ts`).

- Nativo: `@capacitor/geolocation` → `watchPosition` con `enableHighAccuracy: true`, `maximumAge: 0`.
- Web / fallback: `navigator.geolocation.watchPosition` con las mismas opciones.
- Filtros: descarta `accuracy > 40 m` (configurable), saltos de velocidad imposibles, suaviza con Kalman 1D
  y deriva el rumbo del movimiento cuando la velocidad supera 2 m/s.

### Permisos de ubicación precisa

`AndroidManifest.xml` declara:

- `ACCESS_FINE_LOCATION` (ubicación precisa, necesaria para la navegación)
- `ACCESS_COARSE_LOCATION` (Android 12+ exige declararlo junto con FINE)
- `uses-feature` de GPS y red con `required="false"` (la app sigue instalable en dispositivos sin GPS)

En Android 12+ el diálogo ofrece **Precisa** o **Aproximada**; con *Aproximada* la precisión superará el
umbral de 40 m y las lecturas se descartarán. La app pide el permiso en tiempo de ejecución al empezar a
buscar posición (`Geolocation.requestPermissions`). Si el usuario lo deniega se muestra el error y no se
inicia la navegación.

### Ubicación en segundo plano (pantalla apagada) — preparado, no activado

Por defecto el seguimiento es **solo en primer plano**: con la pantalla apagada Android puede suspender el
WebView y detener el GPS. Para soportar pantalla apagada hay un *feature flag* sin forzar nada:

1. Build con `NEXT_PUBLIC_GPS_BACKGROUND=1` y pasar `background: true` a `useGpsTracking`.
   Hoy, sin plugin instalado, el hook avisa por consola y mantiene el seguimiento en primer plano.
2. Instalar un plugin con servicio en primer plano, p. ej. `@capacitor-community/background-geolocation`,
   y conectarlo en `useGpsTracking` alimentando `GpsPipeline.process()` con sus lecturas
   (el filtrado/Kalman/rumbo ya están desacoplados del origen de datos).
3. Descomentar en `AndroidManifest.xml` el bloque marcado “Background location”
   (`ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `POST_NOTIFICATIONS`).
4. Mostrar una notificación persistente mientras se navega y pedir primero el permiso en primer plano y
   luego “Permitir todo el tiempo” (Android 10+).
5. Google Play exige un formulario de declaración y justificación para `ACCESS_BACKGROUND_LOCATION`.

Mientras no se cumplan los pasos 2–3 el flag no cambia el comportamiento.

### Avisos en ruta

Las alertas de cámaras (< 300 m por delante del rumbo) y la capa de semáforos son **informativas y de apoyo
a la conducción prudente**; no sustituyen la señalización ni están pensadas para evadir sanciones.
Sonido y vibración son opcionales y se guardan en `localStorage`.

## Pruebas de utilidades GPS

```bash
cd frontend
npm test          # vitest run (src/lib/gps.test.ts)
```

## APK release

1. Genera un keystore (no lo subas al repo).
2. Configura `android/app/keystore.properties` (gitignored vía `*.keystore`).
3. Build → Generate Signed Bundle / APK en Android Studio.

## Relación con MainV2

Incluye navegación MapLibre, zonas densificadas, rutas vía Valhalla, map matching (`POST /rutas/match`),
recálculo en ruta y capas de cámaras/semáforos. El shell Android no cambia la lógica de negocio: consume
`/api/v1/*` igual que la PWA.
