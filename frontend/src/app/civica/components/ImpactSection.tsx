'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Building2,
  Clock,
  TrendingUp,
  CreditCard,
  Zap,
  SmilePlus,
} from 'lucide-react';

const METRICS = [
  {
    icon: Building2,
    label: 'Trámites presenciales',
    description:
      'Reducción esperada de visitas a Puntos de Atención al Cliente para trámites digitalizables.',
    indicator: 'Objetivo: Reducir',
    color: 'text-metro-600 bg-metro-50',
  },
  {
    icon: Clock,
    label: 'Tiempo de atención',
    description:
      'Disminución del tiempo promedio de atención por trámite mediante autogestión digital.',
    indicator: 'Objetivo: Disminuir',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: TrendingUp,
    label: 'Adopción digital',
    description:
      'Incremento de usuarios que gestionan su Cívica a través de la plataforma digital.',
    indicator: 'Objetivo: Incrementar',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: CreditCard,
    label: 'Tarjetas vinculadas digitalmente',
    description:
      'Cantidad de tarjetas registradas y vinculadas a cuentas mediante auto-enrolamiento.',
    indicator: 'Objetivo: Medir',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Zap,
    label: 'Transacciones digitales',
    description:
      'Volumen de operaciones realizadas a través de los canales digitales del ecosistema.',
    indicator: 'Objetivo: Incrementar',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: SmilePlus,
    label: 'Satisfacción del usuario',
    description:
      'Percepción del usuario respecto a la experiencia de uso de los servicios Cívica digitales.',
    indicator: 'Objetivo: Evaluar',
    color: 'text-rose-600 bg-rose-50',
  },
];

export default function ImpactSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="impacto" className="relative py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
            Impacto
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Indicadores de evaluación
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Métricas clave que podrían utilizarse para evaluar el impacto de la
            transformación digital del ecosistema Cívica.
          </p>
        </motion.div>

        {/* Metric cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {METRICS.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-11 w-11 rounded-xl ${metric.color} flex items-center justify-center`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-50 px-2 py-1 rounded-md">
                    {metric.indicator}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {metric.label}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {metric.description}
                </p>
                {/* Placeholder bar */}
                <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: '60%' } : {}}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.1 }}
                    className="h-full bg-gradient-to-r from-metro-500 to-emerald-400 rounded-full opacity-40"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-10 text-center text-sm text-slate-400 italic max-w-xl mx-auto"
        >
          Estos indicadores representan métricas objetivo/evaluables, no
          resultados ya obtenidos. Su medición dependerá de la implementación.
        </motion.p>
      </div>
    </section>
  );
}
