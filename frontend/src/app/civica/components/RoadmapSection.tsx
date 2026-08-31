'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Search,
  PenTool,
  FlaskConical,
  ClipboardCheck,
  Rocket,
  Globe,
} from 'lucide-react';

const PHASES = [
  {
    num: '01',
    title: 'Diagnóstico',
    icon: Search,
    description:
      'Análisis del ecosistema actual, capacidades técnicas, infraestructura e identificación de oportunidades de digitalización.',
  },
  {
    num: '02',
    title: 'Diseño',
    icon: PenTool,
    description:
      'Definición de arquitectura, protocolos, experiencia de usuario y especificaciones técnicas del ecosistema propuesto.',
  },
  {
    num: '03',
    title: 'Piloto',
    icon: FlaskConical,
    description:
      'Implementación controlada de funcionalidades seleccionadas con un grupo reducido de usuarios para validación.',
  },
  {
    num: '04',
    title: 'Evaluación',
    icon: ClipboardCheck,
    description:
      'Medición de indicadores, recopilación de retroalimentación y ajuste de la propuesta según los resultados obtenidos.',
  },
  {
    num: '05',
    title: 'Escalamiento',
    icon: Rocket,
    description:
      'Despliegue progresivo de las funcionalidades validadas a una base de usuarios más amplia.',
  },
  {
    num: '06',
    title: 'Ecosistema MaaS',
    icon: Globe,
    description:
      'Evolución hacia la integración con billeteras digitales, interoperabilidad y Movilidad como Servicio.',
  },
];

export default function RoadmapSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id="roadmap"
      className="relative py-24 sm:py-32 bg-slate-50 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
            Roadmap
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Hoja de ruta propuesta
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Una ruta de implementación progresiva que permite validar, ajustar y
            escalar cada etapa del ecosistema.
          </p>
        </motion.div>

        {/* Timeline - Horizontal on desktop, Vertical on mobile */}
        {/* Desktop */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-8 left-0 right-0 h-px bg-slate-200" />
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: '100%' } : {}}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
              className="absolute top-8 left-0 h-px bg-gradient-to-r from-metro-500 to-emerald-400"
            />

            <div className="grid grid-cols-6 gap-4">
              {PHASES.map((phase, i) => {
                const Icon = phase.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                    className="text-center"
                  >
                    {/* Node */}
                    <div className="flex justify-center mb-4">
                      <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm relative z-10">
                        <Icon className="h-6 w-6 text-metro-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <span className="text-[10px] font-bold text-metro-500 uppercase tracking-widest">
                      Fase {phase.num}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 mb-2">
                      {phase.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {phase.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile / Tablet - Vertical */}
        <div className="lg:hidden space-y-0">
          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex gap-4"
              >
                {/* Vertical line + node */}
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0 z-10">
                    <Icon className="h-5 w-5 text-metro-600" />
                  </div>
                  {i < PHASES.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8">
                  <span className="text-[10px] font-bold text-metro-500 uppercase tracking-widest">
                    Fase {phase.num}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {phase.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1">
                    {phase.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
