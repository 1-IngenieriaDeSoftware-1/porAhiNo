'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Smartphone,
  Nfc,
  ShieldCheck,
  Link,
  UserCheck,
  Hash,
  AppWindow,
  CheckCircle2,
  ArrowDown,
  Info,
} from 'lucide-react';

const OPTION_A = [
  { icon: CreditCard, label: 'Tarjeta Cívica', desc: 'Tarjeta física del usuario' },
  { icon: Smartphone, label: 'Teléfono compatible', desc: 'Dispositivo con NFC' },
  { icon: Nfc, label: 'Lectura NFC', desc: 'Comunicación de campo cercano' },
  { icon: ShieldCheck, label: 'Validación de identidad', desc: 'Verificación del titular' },
  { icon: Link, label: 'Solicitud de vinculación', desc: 'Petición al sistema central' },
  { icon: UserCheck, label: 'Cuenta Cívica', desc: 'Tarjeta vinculada exitosamente' },
];

const OPTION_B = [
  { icon: Hash, label: 'Código de tarjeta', desc: 'Número impreso en la Cívica' },
  { icon: AppWindow, label: 'Aplicación', desc: 'Ingreso en la app Cívica' },
  { icon: ShieldCheck, label: 'Validación', desc: 'Verificación del código' },
  { icon: CheckCircle2, label: 'Autorización', desc: 'Confirmación del sistema' },
  { icon: UserCheck, label: 'Vinculación', desc: 'Cívica al Portador registrada' },
];

function FlowStep({
  step,
  index,
  isLast,
  accent,
}: {
  step: { icon: React.ElementType; label: string; desc: string };
  index: number;
  isLast: boolean;
  accent: string;
}) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <div
        className={`flex items-center gap-3 w-full max-w-[260px] px-4 py-3 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow ${accent}`}
      >
        <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{step.label}</p>
          <p className="text-[11px] text-slate-400">{step.desc}</p>
        </div>
      </div>
      {!isLast && (
        <div className="flex flex-col items-center py-1">
          <div className="w-px h-3 bg-slate-200" />
          <ArrowDown className="h-3 w-3 text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}

export default function EnrollmentSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeTab, setActiveTab] = useState<'nfc' | 'codigo'>('nfc');

  return (
    <section
      ref={ref}
      id="auto-enrolamiento"
      className="relative py-24 sm:py-32 bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-6"
        >
          <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
            Auto-enrolamiento
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Menos filas. Más autonomía.
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Determinados procesos de registro y vinculación podrían trasladarse
            de forma segura al entorno digital, evitando desplazamientos
            innecesarios a los Puntos de Atención al Cliente.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('nfc')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'nfc'
                  ? 'bg-white text-metro-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Nfc className="w-4 h-4" />
              Opción A — NFC
            </button>
            <button
              onClick={() => setActiveTab('codigo')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'codigo'
                  ? 'bg-white text-metro-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Hash className="w-4 h-4" />
              Opción B — Código
            </button>
          </div>
        </motion.div>

        {/* Flow diagrams */}
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            {activeTab === 'nfc' ? (
              <motion.div
                key="nfc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm"
              >
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    <Nfc className="w-3.5 h-3.5" />
                    Vinculación mediante NFC
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0">
                  {OPTION_A.map((step, i) => (
                    <FlowStep
                      key={i}
                      step={step}
                      index={i}
                      isLast={i === OPTION_A.length - 1}
                      accent="border-emerald-100"
                    />
                  ))}
                </div>

                {/* NFC animation */}
                <div className="flex justify-center mt-6">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-emerald-400/20"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      className="absolute inset-0 rounded-full bg-emerald-400/15"
                    />
                    <div className="relative h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
                      <Nfc className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="codigo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm"
              >
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-metro-50 text-metro-700 text-xs font-semibold">
                    <Hash className="w-3.5 h-3.5" />
                    Vinculación por código
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0">
                  {OPTION_B.map((step, i) => (
                    <FlowStep
                      key={i}
                      step={step}
                      index={i}
                      isLast={i === OPTION_B.length - 1}
                      accent="border-metro-100"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Technical note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 max-w-2xl mx-auto"
        >
          <div className="flex items-start gap-3 bg-slate-50 rounded-xl border border-slate-100 px-5 py-4">
            <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-500 leading-relaxed">
              La implementación definitiva dependerá de la tecnología, protocolos
              de seguridad, arquitectura y capacidades de integración de la
              infraestructura Cívica existente.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
