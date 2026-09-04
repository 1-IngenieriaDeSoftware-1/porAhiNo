'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Building2,
  Unplug,
  Lock,
  User,
  MapPin,
  Clock,
  UserCheck,
  FileText,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowDown,
} from 'lucide-react';

const PROBLEMS = [
  {
    icon: Building2,
    title: 'Dependencia de procesos presenciales',
    description:
      'Determinados trámites asociados a la Cívica requieren que el usuario se desplace hasta un Punto de Atención al Cliente, lo que implica tiempo y espera.',
  },
  {
    icon: Unplug,
    title: 'Fragmentación entre canales',
    description:
      'Los canales físicos y digitales operan de forma separada, limitando una experiencia de usuario integrada y fluida.',
  },
  {
    icon: Lock,
    title: 'Limitada autonomía del usuario',
    description:
      'Los usuarios disponen de opciones limitadas para gestionar su Cívica de manera autónoma desde su dispositivo móvil.',
  },
];

const PRESENCIAL_STEPS = [
  { icon: User, label: 'Usuario' },
  { icon: MapPin, label: 'Desplazamiento' },
  { icon: Building2, label: 'PAC' },
  { icon: Clock, label: 'Espera' },
  { icon: UserCheck, label: 'Atención' },
  { icon: FileText, label: 'Trámite' },
];

const DIGITAL_STEPS = [
  { icon: User, label: 'Usuario' },
  { icon: Smartphone, label: 'App Cívica' },
  { icon: ShieldCheck, label: 'Validación' },
  { icon: Zap, label: 'Operación digital' },
];

function FlowDiagram({
  steps,
  accent,
}: {
  steps: { icon: React.ElementType; label: string }[];
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border bg-white shadow-sm w-full max-w-[220px] ${accent}`}
            >
              <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center py-1">
                <div className="w-px h-4 bg-slate-200" />
                <ArrowDown className="h-3 w-3 text-slate-300" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id="problema"
      className="relative py-24 sm:py-32 bg-slate-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
            Contexto
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            ¿Qué estamos intentando mejorar?
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Un análisis de la experiencia actual del usuario con el sistema
            Cívica y las oportunidades de mejora identificadas.
          </p>
        </motion.div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PROBLEMS.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-metro-50 flex items-center justify-center mb-4 group-hover:bg-metro-100 transition-colors">
                  <Icon className="h-6 w-6 text-metro-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Process comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-10">
            Comparación de procesos
          </h3>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-start max-w-4xl mx-auto">
            {/* Presencial */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                  <Clock className="w-3 h-3" />
                  Proceso presencial
                </span>
              </div>
              <FlowDiagram
                steps={PRESENCIAL_STEPS}
                accent="border-amber-100"
              />
            </div>

            {/* VS divider */}
            <div className="hidden md:flex flex-col items-center justify-center h-full">
              <div className="w-px h-16 bg-slate-200" />
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center my-2">
                <span className="text-xs font-bold text-slate-400">VS</span>
              </div>
              <div className="w-px h-16 bg-slate-200" />
            </div>
            <div className="md:hidden flex justify-center py-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400">VS</span>
              </div>
            </div>

            {/* Digital */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <Zap className="w-3 h-3" />
                  Proceso digital
                </span>
              </div>
              <FlowDiagram
                steps={DIGITAL_STEPS}
                accent="border-emerald-100"
              />
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center text-sm text-slate-400 italic max-w-2xl mx-auto"
        >
          No todos los procesos necesariamente pueden o deben digitalizarse. La
          propuesta busca identificar cuáles pueden trasladarse de manera segura
          al entorno digital.
        </motion.p>
      </div>
    </section>
  );
}
