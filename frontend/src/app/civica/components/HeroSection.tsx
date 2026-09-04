'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Smartphone,
  Nfc,
  Plus,
  Clock,
  CreditCard,
  ArrowDown,
  Layers,
  Signal,
  ChevronRight,
} from 'lucide-react';

function PhoneMockup() {
  return (
    <motion.div
      animate={{ y: [0, -20, 0], rotate: [0, -1, 1, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      className="relative mx-auto w-[280px] sm:w-[300px]"
    >
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border-[6px] border-slate-700 bg-slate-800 p-1 shadow-2xl shadow-metro-900/30">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-700 rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-900 to-slate-950 min-h-[520px]">
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

          {/* App header */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-metro-600 flex items-center justify-center">
                <Smartphone className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white text-sm font-bold tracking-wide">
                Cívica Digital
              </span>
            </div>
            <Nfc className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Greeting */}
          <div className="px-5 pt-1">
            <p className="text-slate-400 text-xs">Bienvenido</p>
            <p className="text-white text-base font-semibold">Hola, Daniel</p>
          </div>

          {/* Balance card */}
          <div className="mx-5 mt-3 rounded-2xl bg-gradient-to-br from-metro-600 via-metro-700 to-indigo-800 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <p className="text-metro-200 text-[10px] font-medium uppercase tracking-wider">
              Saldo disponible
            </p>
            <p className="text-white text-2xl font-bold mt-1">$45.200</p>
            <p className="text-metro-200 text-[10px] mt-0.5">COP</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-[10px] font-medium">
                Cívica Activa
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2 px-5 mt-4">
            {[
              { icon: Plus, label: 'Recargar', color: 'bg-metro-500/20 text-metro-400' },
              { icon: Clock, label: 'Historial', color: 'bg-slate-500/20 text-slate-400' },
              { icon: CreditCard, label: 'Tarjetas', color: 'bg-purple-500/20 text-purple-400' },
              { icon: Nfc, label: 'NFC', color: 'bg-emerald-500/20 text-emerald-400' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-slate-400 font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Credential */}
          <div className="mx-5 mt-4 flex items-center justify-between bg-slate-800/80 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Nfc className="w-4 h-4 text-emerald-400" />
              <span className="text-white text-xs font-medium">Credencial Móvil</span>
            </div>
            <div className="w-8 h-[18px] rounded-full bg-metro-600 flex items-center justify-end px-0.5">
              <div className="w-3.5 h-3.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Recent activity */}
          <div className="px-5 mt-4 pb-6">
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
              Actividad reciente
            </p>
            {[
              { name: 'Estación Industriales', amount: '-$2.950', color: 'text-red-400' },
              { name: 'Recarga digital', amount: '+$20.000', color: 'text-green-400' },
              { name: 'Estación Niquia', amount: '-$2.950', color: 'text-red-400' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-slate-800 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </div>
                  <span className="text-slate-300 text-[11px]">{item.name}</span>
                </div>
                <span className={`text-[11px] font-semibold ${item.color}`}>
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 60, damping: 15 } },
  };

  return (
    <section
      ref={ref}
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-metro-950 to-slate-900"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-metro-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-32 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            className="max-w-2xl"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-metro-400/30 bg-metro-500/10 text-[11px] font-semibold text-metro-300 uppercase tracking-widest">
                Ampliación técnica · Caso M00746243
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white"
            >
              Cívica: de tarjeta de transporte a{' '}
              <span className="bg-gradient-to-r from-metro-400 via-emerald-400 to-metro-300 bg-clip-text text-transparent">
                ecosistema digital
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 text-lg sm:text-xl text-slate-300 leading-relaxed"
            >
              Propuesta técnica de modernización y digitalización integral del
              sistema Cívica del Metro de Medellín.
            </motion.p>

            <motion.p
              variants={item}
              className="mt-4 text-base text-slate-400 leading-relaxed max-w-xl"
            >
              Una propuesta para evolucionar la experiencia del usuario mediante
              autogestión digital, NFC, vinculación de tarjetas, credenciales
              móviles y una hoja de ruta hacia la movilidad como servicio.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-4">
              <a
                href="#propuesta"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-metro-600 text-white text-sm font-semibold hover:bg-metro-500 transition-colors shadow-lg shadow-metro-600/25"
              >
                Explorar la propuesta
                <ArrowDown className="w-4 h-4" />
              </a>
              <a
                href="#arquitectura"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <Layers className="w-4 h-4" />
                Ver arquitectura
              </a>
            </motion.div>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="flex justify-center lg:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
    </section>
  );
}
