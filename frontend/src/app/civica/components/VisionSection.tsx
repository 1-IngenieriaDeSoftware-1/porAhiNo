'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  CreditCard,
  User,
  Smartphone,
  Wallet,
  Globe,
  ArrowRight,
} from 'lucide-react';

const EVOLUTION = [
  {
    icon: CreditCard,
    label: 'Tarjeta física',
    description: 'Medio de acceso y recaudo actual.',
  },
  {
    icon: User,
    label: 'Cuenta digital',
    description: 'Gestión integral desde la app.',
  },
  {
    icon: Smartphone,
    label: 'Credencial móvil',
    description: 'El dispositivo como medio de acceso.',
  },
  {
    icon: Wallet,
    label: 'Billetera digital',
    description: 'Integración con ecosistemas de pago.',
  },
  {
    icon: Globe,
    label: 'Movilidad como Servicio',
    description: 'Plataforma integral de transporte.',
  },
];

export default function VisionSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="relative py-24 sm:py-32 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-metro-600/5 rounded-full blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-400 uppercase tracking-wider">
            Visión de futuro
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            De una tarjeta a una identidad de movilidad
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Una visión progresiva de cómo el sistema Cívica podría evolucionar
            desde un medio físico hacia una plataforma integral de movilidad.
          </p>
        </motion.div>

        {/* Evolution flow */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
          {EVOLUTION.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex items-center gap-4 lg:gap-0"
              >
                <div className="flex flex-col items-center text-center w-[160px]">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 hover:border-metro-500 transition-colors">
                    <Icon className="h-7 w-7 text-metro-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    {stage.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                {i < EVOLUTION.length - 1 && (
                  <div className="hidden lg:flex items-center px-3">
                    <motion.div
                      animate={{ x: [0, 6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    >
                      <ArrowRight className="h-5 w-5 text-slate-600" />
                    </motion.div>
                  </div>
                )}
                {i < EVOLUTION.length - 1 && (
                  <div className="lg:hidden">
                    <ArrowRight className="h-4 w-4 text-slate-600 rotate-90" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-14 text-center text-sm text-slate-500 italic max-w-xl mx-auto"
        >
          Esta es una visión de largo plazo. Cada etapa requiere validación
          técnica, operacional, regulatoria y de seguridad.
        </motion.p>
      </div>
    </section>
  );
}
