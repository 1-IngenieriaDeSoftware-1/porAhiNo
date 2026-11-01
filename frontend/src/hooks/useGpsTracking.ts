'use client';

/**
 * Fuente única de posición para navegación.
 * Nativo (Capacitor): @capacitor/geolocation watchPosition.
 * Web: navigator.geolocation.watchPosition.
 * Aplica filtro de precisión, descarte de saltos imposibles, Kalman 1D y rumbo
 * derivado del movimiento (ver lib/gps.ts).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_HEADING_MIN_SPEED_MPS,
  DEFAULT_MAX_ACCURACY_M,
  DEFAULT_MAX_SPEED_MPS,
  GPS_BACKGROUND_ENABLED,
  GpsPipeline,
  type GpsFix,
  type GpsRawReading,
  type GpsTrackingOptions,
  type GpsTrackingState,
} from '@/lib/gps';
import { isNativePlatform } from '@/lib/native';

export type { GpsFix, GpsTrackingOptions, GpsTrackingState } from '@/lib/gps';

const INITIAL_STATE: GpsTrackingState = {
  status: 'idle',
  fix: null,
  rawFix: null,
  error: null,
  acceptedCount: 0,
  discardedCount: 0,
  lastDiscardReason: null,
  backgroundRequested: false,
  isNative: false,
};

export interface UseGpsTrackingResult extends GpsTrackingState {
  /** Reinicia el filtro y el watch (p. ej. tras conceder permisos). */
  restart: () => void;
}

export function useGpsTracking(options: GpsTrackingOptions = {}): UseGpsTrackingResult {
  const {
    enabled = true,
    maxAccuracyM = DEFAULT_MAX_ACCURACY_M,
    maxSpeedMps = DEFAULT_MAX_SPEED_MPS,
    smooth = true,
    headingMinSpeedMps = DEFAULT_HEADING_MIN_SPEED_MPS,
    kalmanProcessNoise = 3,
    background = false,
  } = options;

  const [state, setState] = useState<GpsTrackingState>(INITIAL_STATE);
  const [nonce, setNonce] = useState(0);
  const restart = useCallback(() => setNonce((n) => n + 1), []);
  const pipelineRef = useRef<GpsPipeline | null>(null);

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL_STATE);
      return;
    }

    let cancelled = false;
    let clearWatch: (() => void) | null = null;
    const native = isNativePlatform();
    const backgroundRequested = background && GPS_BACKGROUND_ENABLED;
    const pipeline = new GpsPipeline({
      maxAccuracyM,
      maxSpeedMps,
      smooth,
      headingMinSpeedMps,
      kalmanProcessNoise,
    });
    pipelineRef.current = pipeline;

    setState({ ...INITIAL_STATE, status: 'starting', isNative: native, backgroundRequested });

    if (backgroundRequested) {
      // Preparado, no forzado: el plugin de background no está incluido por defecto.
      // eslint-disable-next-line no-console
      console.warn(
        '[gps] Background solicitado: instala el plugin de localización en segundo plano (docs/ANDROID.md). Se usa seguimiento en primer plano.',
      );
    }

    const handleReading = (reading: GpsRawReading) => {
      if (cancelled) return;
      const result = pipeline.process(reading);
      if (!result.accepted) {
        setState((s) => ({
          ...s,
          status: s.status === 'starting' ? 'starting' : s.status,
          discardedCount: s.discardedCount + 1,
          lastDiscardReason: result.reason,
        }));
        return;
      }
      setState((s) => ({
        ...s,
        status: 'tracking',
        fix: result.fix,
        rawFix: result.raw,
        error: null,
        acceptedCount: s.acceptedCount + 1,
      }));
    };

    const handleError = (code: 'denied' | 'unavailable' | 'error', message: string) => {
      if (cancelled) return;
      setState((s) => ({ ...s, status: code, error: message }));
    };

    const toReading = (c: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      speed?: number | null;
      heading?: number | null;
    }, ts: number): GpsRawReading => ({
      lat: c.latitude,
      lon: c.longitude,
      accuracy: c.accuracy ?? null,
      speed: c.speed ?? null,
      heading: c.heading ?? null,
      timestamp: ts || Date.now(),
    });

    const startWeb = () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        handleError('unavailable', 'Geolocalización no disponible en este dispositivo');
        return;
      }
      const id = navigator.geolocation.watchPosition(
        (pos) => handleReading(toReading(pos.coords, pos.timestamp)),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            handleError('denied', 'Permiso de ubicación denegado');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            handleError('unavailable', 'Ubicación no disponible');
          } else {
            // TIMEOUT: el watch sigue vivo, solo informamos.
            setState((s) => ({ ...s, error: 'Señal GPS débil o lenta' }));
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      );
      clearWatch = () => navigator.geolocation.clearWatch(id);
    };

    const startNative = async () => {
      const { Geolocation } = await import('@capacitor/geolocation');
      try {
        let perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          perm = await Geolocation.requestPermissions({ permissions: ['location'] });
        }
        if (perm.location === 'denied') {
          handleError('denied', 'Permiso de ubicación denegado');
          return;
        }
      } catch {
        // Algunos WebViews no exponen checkPermissions; seguimos y que watch decida.
      }
      if (cancelled) return;
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
        (pos, err) => {
          if (err) {
            const msg = String((err as { message?: string }).message || err);
            if (/denied|permission/i.test(msg)) handleError('denied', 'Permiso de ubicación denegado');
            else setState((s) => ({ ...s, error: msg }));
            return;
          }
          if (pos) handleReading(toReading(pos.coords, pos.timestamp));
        },
      );
      if (cancelled) {
        Geolocation.clearWatch({ id }).catch(() => undefined);
        return;
      }
      clearWatch = () => {
        Geolocation.clearWatch({ id }).catch(() => undefined);
      };
    };

    if (native) {
      startNative().catch((e) => {
        // Si el plugin falla, cae a la API web del WebView.
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.warn('[gps] plugin nativo falló, usando navigator.geolocation', e);
        startWeb();
      });
    } else {
      startWeb();
    }

    return () => {
      cancelled = true;
      clearWatch?.();
      pipelineRef.current = null;
    };
  }, [
    enabled,
    maxAccuracyM,
    maxSpeedMps,
    smooth,
    headingMinSpeedMps,
    kalmanProcessNoise,
    background,
    nonce,
  ]);

  return { ...state, restart };
}

export default useGpsTracking;

/** Alias de tipo para consumidores que solo necesitan la posición. */
export type GpsPosition = GpsFix;
