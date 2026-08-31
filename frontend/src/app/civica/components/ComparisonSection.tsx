'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const COMPARISONS = [
  {
    feature: 'Acceso en Torniquete',
    current: 'Lectura óptica de Código QR',
    proposed: 'NFC Nativo (Tap-and-Go)',
    benefit: 'Mayor velocidad de paso por minuto en molinetes',
  },
  {
    feature: 'Personalización de Tarjetas',
    current: 'Presencial en PAC',
    proposed: 'Auto-enrolamiento vía NFC móvil',
    benefit: 'Eliminación de filas en oficinas PAC',
  },
  {
    feature: 'Vinculación Cívica al Portador',
    current: 'Presencial o no disponible en app',
    proposed: 'Registro digital mediante código impreso',
    benefit: 'Descentralización total del trámite de registro',
  },
  {
    feature: 'Pérdida/Cambio de Dispositivo',
    current: 'Trámite presencial / bloqueo telefónico',
    proposed: 'Gestión e inhabilitación remota del token',
    benefit: 'Protección inmediata de saldo sin acudir a un punto físico',
  },
  {
    feature: 'Billeteras Digitales',
    current: 'Exclusivo dentro de App Cívica',
    proposed: 'Integración con billeteras estándar',
    benefit: 'Estándar global de Movilidad como Servicio (MaaS)',
  },
];

export default function ComparisonSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
            Comparativa
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Estado actual vs. propuesta
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Comparación funcional entre las capacidades actuales y la propuesta
            de evolución del ecosistema Cívica.
          </p>
        </motion.div>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-0 bg-slate-50 border-b border-slate-200">
              <div className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Funcionalidad
              </div>
              <div className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Estado Actual
              </div>
              <div className="px-6 py-4 text-xs font-bold text-metro-500 uppercase tracking-wider">
                Propuesta Técnica
              </div>
              <div className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Beneficio
              </div>
            </div>

            {/* Rows */}
            {COMPARISONS.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 gap-0 ${
                  i < COMPARISONS.length - 1 ? 'border-b border-slate-100' : ''
                } hover:bg-slate-50/50 transition-colors`}
              >
                <div className="px-6 py-5">
                  <p className="text-sm font-semibold text-slate-900">
                    {row.feature}
                  </p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-slate-500">{row.current}</p>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-metro-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-800 font-medium">
                      {row.proposed}
                    </p>
                  </div>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-emerald-600 font-medium">
                    {row.benefit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-4">
          {COMPARISONS.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
            >
              <h3 className="text-base font-bold text-slate-900 mb-3">
                {row.feature}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Estado actual
                  </p>
                  <p className="text-sm text-slate-500">{row.current}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-metro-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-metro-500 uppercase tracking-wider mb-1">
                    Propuesta
                  </p>
                  <p className="text-sm text-slate-800 font-medium">
                    {row.proposed}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg px-3 py-2 mt-2">
                  <p className="text-xs text-emerald-700 font-medium">
                    {row.benefit}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
