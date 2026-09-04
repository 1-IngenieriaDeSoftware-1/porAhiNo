'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  User,
  Smartphone,
  KeyRound,
  Nfc,
  CreditCard,
  RefreshCw,
  Wallet,
  Bell,
  ShieldCheck,
  Server,
  Database,
  HardDrive,
  MonitorSmartphone,
  ArrowDown,
  Info,
} from 'lucide-react';

const LAYERS = [
  {
    label: 'USUARIO',
    color: 'from-metro-500 to-metro-600',
    borderColor: 'border-metro-200',
    bgColor: 'bg-metro-50',
    icon: User,
    items: null,
  },
  {
    label: 'APP CÍVICA',
    color: 'from-emerald-500 to-metro-500',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    icon: Smartphone,
    items: [
      { icon: KeyRound, label: 'Autenticación' },
      { icon: Nfc, label: 'NFC' },
      { icon: CreditCard, label: 'Cívica al Portador' },
      { icon: RefreshCw, label: 'Recargas' },
      { icon: Wallet, label: 'Gestión de cuenta' },
    ],
  },
  {
    label: 'API / SERVICIOS',
    color: 'from-indigo-500 to-purple-500',
    borderColor: 'border-indigo-200',
    bgColor: 'bg-indigo-50',
    icon: Server,
    items: [
      { icon: KeyRound, label: 'Identidad' },
      { icon: CreditCard, label: 'Tarjetas' },
      { icon: RefreshCw, label: 'Transacciones' },
      { icon: Wallet, label: 'Saldo' },
      { icon: Bell, label: 'Notificaciones' },
      { icon: ShieldCheck, label: 'Seguridad' },
    ],
  },
  {
    label: 'SISTEMAS CENTRALES',
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
    icon: Database,
    items: [
      { icon: User, label: 'Cuenta' },
      { icon: Wallet, label: 'Recaudo' },
      { icon: CreditCard, label: 'Tarjetas' },
      { icon: RefreshCw, label: 'Transacciones' },
      { icon: Database, label: 'Datos' },
    ],
  },
  {
    label: 'INFRAESTRUCTURA',
    color: 'from-slate-600 to-slate-700',
    borderColor: 'border-slate-200',
    bgColor: 'bg-slate-50',
    icon: HardDrive,
    items: [
      { icon: MonitorSmartphone, label: 'Validadores' },
      { icon: HardDrive, label: 'Torniquetes' },
      { icon: User, label: 'PAC' },
      { icon: Smartphone, label: 'Canales digitales' },
    ],
  },
];

export default function ArchitectureSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id="arquitectura"
      className="relative py-24 sm:py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-400 uppercase tracking-wider">
            Arquitectura
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Una propuesta pensada como sistema
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Visión conceptual de las capas que compondrían un ecosistema Cívica
            Digital integrado.
          </p>
        </motion.div>

        {/* Architecture layers */}
        <div className="space-y-0">
          {LAYERS.map((layer, i) => {
            const LayerIcon = layer.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 70, damping: 15, delay: i * 0.15 }}
              >
                <div className="relative">
                  {/* Layer card */}
                  <div
                    className={`relative rounded-2xl border ${layer.borderColor} ${layer.bgColor} p-5 sm:p-6 backdrop-blur-sm`}
                  >
                    {/* Layer header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`h-8 w-8 rounded-lg bg-gradient-to-br ${layer.color} flex items-center justify-center shadow-md`}
                      >
                        <LayerIcon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                        {layer.label}
                      </span>
                    </div>

                    {/* Items */}
                    {layer.items && (
                      <div className="flex flex-wrap gap-2">
                        {layer.items.map((item, j) => {
                          const ItemIcon = item.icon;
                          return (
                            <div
                              key={j}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-slate-100 text-xs text-slate-600 font-medium shadow-sm"
                            >
                              <ItemIcon className="w-3 h-3 text-slate-400" />
                              {item.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Connector arrow */}
                  {i < LAYERS.length - 1 && (
                    <div className="flex justify-center py-2">
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      >
                        <ArrowDown className="h-5 w-5 text-slate-500" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 max-w-2xl mx-auto"
        >
          <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl border border-slate-700 px-5 py-4">
            <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Arquitectura conceptual. No representa la arquitectura interna
              actual del Metro de Medellín.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
