'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Smartphone,
  CreditCard,
  Clock,
  Plus,
  Nfc,
  Shield,
  Lock,
  Home,
  ChevronRight,
  Signal,
  Search,
  ArrowLeft,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';

const SCREENS = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: Home,
  },
  {
    id: 'saldo',
    label: 'Saldo',
    icon: CreditCard,
  },
  {
    id: 'historial',
    label: 'Historial',
    icon: Clock,
  },
  {
    id: 'recargar',
    label: 'Recargar',
    icon: Plus,
  },
  {
    id: 'tarjetas',
    label: 'Mis tarjetas',
    icon: CreditCard,
  },
  {
    id: 'registrar',
    label: 'Registrar tarjeta',
    icon: Nfc,
  },
  {
    id: 'nfc',
    label: 'Escanear NFC',
    icon: Nfc,
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    icon: Shield,
  },
  {
    id: 'bloquear',
    label: 'Bloquear tarjeta',
    icon: Lock,
  },
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[280px] sm:w-[300px] mx-auto">
      <div className="rounded-[2.5rem] border-[6px] border-slate-700 bg-slate-800 p-1 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-700 rounded-b-2xl z-10" />
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 min-h-[540px]">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2">
            <span className="text-[10px] text-slate-400 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="w-3 h-3 text-slate-400" />
              <div className="w-5 h-2.5 rounded-sm border border-slate-400 p-[1px]">
                <div className="h-full w-3/4 bg-green-400 rounded-[1px]" />
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ScreenInicio() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-metro-600 flex items-center justify-center">
            <Smartphone className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white text-sm font-bold">Cívica Digital</span>
        </div>
        <Nfc className="w-5 h-5 text-emerald-400" />
      </div>
      <p className="text-slate-400 text-xs">Bienvenido</p>
      <p className="text-white text-base font-semibold mb-3">Hola, Daniel</p>
      <div className="rounded-2xl bg-gradient-to-br from-metro-600 to-indigo-800 p-4 mb-4">
        <p className="text-metro-200 text-[10px] uppercase tracking-wider">Saldo disponible</p>
        <p className="text-white text-2xl font-bold mt-1">$45.200</p>
        <p className="text-metro-200 text-[10px]">COP</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Plus, label: 'Recargar', c: 'bg-metro-500/20 text-metro-400' },
          { icon: Clock, label: 'Historial', c: 'bg-slate-500/20 text-slate-400' },
          { icon: CreditCard, label: 'Tarjetas', c: 'bg-purple-500/20 text-purple-400' },
          { icon: Shield, label: 'Seguridad', c: 'bg-amber-500/20 text-amber-400' },
        ].map(({ icon: Icon, label, c }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[9px] text-slate-400">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Reciente</p>
        {['Estación Industriales', 'Recarga digital'].map((n, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50">
            <span className="text-slate-300 text-[11px]">{n}</span>
            <span className={`text-[11px] font-semibold ${i === 0 ? 'text-red-400' : 'text-green-400'}`}>
              {i === 0 ? '-$2.950' : '+$20.000'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenSaldo() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span className="text-white text-sm font-semibold">Saldo</span>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-metro-600 to-indigo-800 p-5 text-center mb-4">
        <p className="text-metro-200 text-xs uppercase">Saldo actual</p>
        <p className="text-white text-4xl font-bold mt-2">$45.200</p>
        <p className="text-metro-200 text-xs mt-1">COP · Cívica Personalizada</p>
      </div>
      <div className="space-y-3">
        <div className="bg-slate-800/60 rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-slate-300 text-xs">Tipo</span>
          <span className="text-white text-xs font-medium">Personalizada</span>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-slate-300 text-xs">Estado</span>
          <span className="text-green-400 text-xs font-medium">Activa</span>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-slate-300 text-xs">Última recarga</span>
          <span className="text-white text-xs font-medium">20 Ago 2026</span>
        </div>
      </div>
    </div>
  );
}

function ScreenHistorial() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span className="text-white text-sm font-semibold">Historial</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-slate-800/60 rounded-lg px-3 py-2 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 text-[11px]">Buscar transacción...</span>
        </div>
      </div>
      <p className="text-slate-500 text-[10px] font-semibold uppercase mb-2">Agosto 2026</p>
      {[
        { name: 'Est. Industriales', amount: '-$2.950', date: '22 Ago', neg: true },
        { name: 'Recarga digital', amount: '+$20.000', date: '20 Ago', neg: false },
        { name: 'Est. Poblado', amount: '-$2.950', date: '19 Ago', neg: true },
        { name: 'Est. Envigado', amount: '-$2.950', date: '18 Ago', neg: true },
        { name: 'Recarga digital', amount: '+$10.000', date: '15 Ago', neg: false },
        { name: 'Est. Niquia', amount: '-$2.950', date: '14 Ago', neg: true },
      ].map((t, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-800/40">
          <div>
            <p className="text-slate-200 text-[11px] font-medium">{t.name}</p>
            <p className="text-slate-500 text-[9px]">{t.date}</p>
          </div>
          <span className={`text-[11px] font-semibold ${t.neg ? 'text-red-400' : 'text-green-400'}`}>
            {t.amount}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScreenRecargar() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span className="text-white text-sm font-semibold">Recargar</span>
      </div>
      <p className="text-slate-400 text-xs mb-4">Selecciona el monto a recargar</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {['$5.000', '$10.000', '$20.000', '$30.000', '$50.000', 'Otro'].map((m) => (
          <div
            key={m}
            className={`rounded-xl py-3 text-center text-xs font-semibold cursor-pointer transition-colors ${
              m === '$20.000'
                ? 'bg-metro-600 text-white'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {m}
          </div>
        ))}
      </div>
      <div className="bg-slate-800/60 rounded-xl px-4 py-3 mb-4">
        <p className="text-slate-400 text-[10px] mb-1">Tarjeta destino</p>
        <p className="text-white text-xs font-medium">Cívica •••• 4521</p>
      </div>
      <button className="w-full py-3 rounded-xl bg-metro-600 text-white text-sm font-semibold">
        Confirmar recarga
      </button>
    </div>
  );
}

function ScreenTarjetas() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span className="text-white text-sm font-semibold">Mis tarjetas</span>
      </div>
      {[
        { name: 'Cívica Personalizada', num: '•••• 4521', status: 'Activa', active: true },
        { name: 'Cívica al Portador', num: '•••• 8903', status: 'Vinculada', active: true },
      ].map((card, i) => (
        <div key={i} className="bg-slate-800/60 rounded-xl px-4 py-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-metro-400" />
              <div>
                <p className="text-white text-xs font-medium">{card.name}</p>
                <p className="text-slate-500 text-[10px]">{card.num}</p>
              </div>
            </div>
            <span className="text-green-400 text-[10px] font-semibold">{card.status}</span>
          </div>
        </div>
      ))}
      <button className="w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 text-xs font-medium mt-2 flex items-center justify-center gap-2">
        <Plus className="w-3.5 h-3.5" />
        Registrar nueva tarjeta
      </button>
    </div>
  );
}

function ScreenRegistrar() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span className="text-white text-sm font-semibold">Registrar tarjeta</span>
      </div>
      <p className="text-slate-400 text-xs mb-5">Selecciona cómo registrar tu Cívica</p>
      <div className="space-y-3">
        <div className="bg-slate-800/60 rounded-xl px-4 py-4 flex items-center gap-3 border border-metro-500/30">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Nfc className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-medium">Escanear con NFC</p>
            <p className="text-slate-400 text-[10px]">Acerca tu tarjeta al teléfono</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
        <div className="bg-slate-800/60 rounded-xl px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-metro-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-metro-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-medium">Ingresar código</p>
            <p className="text-slate-400 text-[10px]">Usa el código de tu Cívica al Portador</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </div>
  );
}

function ScreenNfc() {
  return (
    <div className="px-4 pb-6 text-center">
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span className="text-white text-sm font-semibold">Escanear NFC</span>
      </div>
      <div className="mt-10 mb-6">
        <div className="relative mx-auto w-24 h-24">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-emerald-400/20"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
            className="absolute inset-0 rounded-full bg-emerald-400/15"
          />
          <div className="absolute inset-4 rounded-full bg-emerald-900/40 flex items-center justify-center border border-emerald-500/30">
            <Nfc className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>
      <p className="text-white text-sm font-semibold">Acerca tu Cívica</p>
      <p className="text-slate-400 text-[11px] mt-1 max-w-[200px] mx-auto">
        Coloca la tarjeta en la parte trasera de tu teléfono
      </p>
      <div className="mt-8 bg-slate-800/60 rounded-xl px-4 py-3">
        <p className="text-slate-500 text-[10px]">Esperando conexión NFC...</p>
      </div>
    </div>
  );
}

function ScreenSeguridad() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span className="text-white text-sm font-semibold">Seguridad</span>
      </div>
      <div className="space-y-3">
        {[
          { icon: Shield, label: 'Autenticación', desc: 'Biometría activada', on: true },
          { icon: Smartphone, label: 'Dispositivo', desc: 'iPhone — Verificado', on: true },
          { icon: Eye, label: 'Ocultar saldo', desc: 'En pantalla de inicio', on: false },
          { icon: AlertTriangle, label: 'Alertas', desc: 'Notificaciones de uso', on: true },
        ].map(({ icon: Icon, label, desc, on }, i) => (
          <div key={i} className="bg-slate-800/60 rounded-xl px-4 py-3 flex items-center gap-3">
            <Icon className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <p className="text-white text-xs font-medium">{label}</p>
              <p className="text-slate-500 text-[10px]">{desc}</p>
            </div>
            <div className={`w-8 h-[18px] rounded-full flex items-center px-0.5 ${on ? 'bg-metro-600 justify-end' : 'bg-slate-600 justify-start'}`}>
              <div className="w-3.5 h-3.5 rounded-full bg-white" />
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-3 rounded-xl bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5" />
        Bloquear tarjeta
      </button>
    </div>
  );
}

function ScreenBloquear() {
  return (
    <div className="px-4 pb-6 text-center">
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
        <span className="text-white text-sm font-semibold">Bloquear tarjeta</span>
      </div>
      <div className="mt-8 mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-400" />
        </div>
      </div>
      <p className="text-white text-sm font-semibold">¿Bloquear tu Cívica?</p>
      <p className="text-slate-400 text-[11px] mt-2 max-w-[220px] mx-auto">
        El saldo y la credencial móvil quedarán inhabilitados hasta que la desbloquees.
      </p>
      <div className="bg-slate-800/60 rounded-xl px-4 py-3 mt-6 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-300 text-xs">Cívica •••• 4521</span>
          <span className="text-green-400 text-[10px] font-semibold">Activa</span>
        </div>
      </div>
      <button className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-semibold">
        Confirmar bloqueo
      </button>
      <button className="w-full py-3 mt-2 rounded-xl text-slate-400 text-xs">
        Cancelar
      </button>
    </div>
  );
}

const SCREEN_COMPONENTS: Record<string, React.FC> = {
  inicio: ScreenInicio,
  saldo: ScreenSaldo,
  historial: ScreenHistorial,
  recargar: ScreenRecargar,
  tarjetas: ScreenTarjetas,
  registrar: ScreenRegistrar,
  nfc: ScreenNfc,
  seguridad: ScreenSeguridad,
  bloquear: ScreenBloquear,
};

export default function UXSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeScreen, setActiveScreen] = useState('inicio');
  const ActiveComponent = SCREEN_COMPONENTS[activeScreen];

  return (
    <section ref={ref} id="experiencia" className="relative py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
            Experiencia de Usuario
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Diseñada para ser intuitiva
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Exploración conceptual de las pantallas principales de una aplicación
            Cívica Digital modernizada.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start">
          {/* Screen selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Pantallas
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCREENS.map((screen) => {
                const Icon = screen.icon;
                return (
                  <button
                    key={screen.id}
                    onClick={() => setActiveScreen(screen.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeScreen === screen.id
                        ? 'bg-metro-600 text-white shadow-md'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {screen.label}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 italic mt-6">
              Interfaz conceptual. No representa el diseño final de la aplicación.
            </p>
          </motion.div>

          {/* Phone preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.2 }}
          >
            <PhoneFrame>
              <ActiveComponent />
            </PhoneFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
