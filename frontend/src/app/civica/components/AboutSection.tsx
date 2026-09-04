'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { User, GraduationCap, FileText, Mail } from 'lucide-react';

export default function AboutSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-24 sm:py-32 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl border border-slate-100 p-8 sm:p-10 shadow-sm"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
                Sobre la propuesta
              </span>
            </div>

            {/* Author */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-metro-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-lg shadow-metro-600/20">
                <User className="h-9 w-9 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-bold text-slate-900">
                  Daniel Montiel
                </h3>
                <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                  <p className="text-sm text-slate-500">
                    Estudiante de Ingeniería de Sistemas e Informática
                  </p>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Universidad Pontificia Bolivariana
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-start gap-3 mb-6">
                <FileText className="h-5 w-5 text-metro-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  Propuesta de ampliación y evolución técnica del caso
                  M00746243, presentado previamente al Metro de Medellín.
                </p>
              </div>

              {/* CTA */}
              <div className="flex justify-center">
                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Contactar / Solicitar información
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
