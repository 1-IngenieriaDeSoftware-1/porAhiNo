'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, ArrowUpRight } from 'lucide-react';

export default function DocumentSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="documento" className="relative py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-slate-900 via-metro-950 to-slate-900 rounded-3xl p-8 sm:p-12 overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-metro-600/10 rounded-full blur-[60px]" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-[50px]" />

            <div className="relative z-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-metro-600/20 border border-metro-500/20 flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-metro-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                ¿Quieres conocer la propuesta completa?
              </h2>

              <p className="text-slate-400 leading-relaxed mb-8 max-w-lg mx-auto">
                Consulta el documento técnico con objetivos, arquitectura
                conceptual, consideraciones de seguridad, fases de
                implementación e indicadores de evaluación.
              </p>

              <a
                href="#"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-metro-600 text-white font-semibold hover:bg-metro-500 transition-colors shadow-lg shadow-metro-600/25"
              >
                Ver propuesta técnica
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
