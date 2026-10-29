'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { rutasService } from '@/services/rutasService';
import { apiErrorMessage } from '@/lib/utils';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export default function AlertasPushPanel() {
  const { user } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activar = async () => {
    setErr(null);
    setMsg(null);
    if (!user) {
      setErr('Inicia sesión para activar avisos.');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setErr('Este navegador no soporta Web Push.');
      return;
    }
    setLoading(true);
    try {
      const { publicKey, configured } = await rutasService.vapidPublicKey();
      if (!configured || !publicKey) {
        setMsg(
          'Avisos listos en backend, pero faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en .env. Puedes generarlas con: python -m scripts.generate_vapid',
        );
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await rutasService.subscribePush({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
        user_agent: navigator.userAgent,
      });
      setMsg('Suscripción guardada. Recibirás aviso el día anterior si tienes restricción.');
    } catch (e) {
      setErr(apiErrorMessage(e, 'No se pudo activar push'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold text-primary-800">Aviso un día antes</h2>
      <p className="text-sm text-ink-600">
        MainV2: suscríbete a Web Push para que te avisemos si mañana tu placa tiene Pico y Placa, con
        enlace a rutas alternativas.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={activar}
        className="rounded-xl bg-primary-700 text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        {loading ? 'Activando…' : 'Activar notificaciones'}
      </button>
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
