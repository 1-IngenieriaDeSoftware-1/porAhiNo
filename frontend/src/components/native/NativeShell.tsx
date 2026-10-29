'use client';

import { useEffect } from 'react';
import { initNativeShell } from '@/lib/native';

/** Inicializa StatusBar / Splash cuando corre dentro de Capacitor. */
export default function NativeShell() {
  useEffect(() => {
    void initNativeShell();
  }, []);
  return null;
}
