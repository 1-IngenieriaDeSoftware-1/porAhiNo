'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Smartphone,
  UserPlus,
  Nfc,
  Globe,
  Check,
} from 'lucide-react';

const MODULES = [
  {
    num: '01',
    title: 'Cívica Digital',
    icon: Smartphone,
    color: 'bg-metro-50 text-metro-600 border-metro-100 group-hover:border-metro-300',
    iconBg: 'bg-metro-100',
    description:
      'Gestión de saldo, historial, recargas, credenciales y seguridad desde la aplicación.',
    features: [
      'Consulta de saldo en tiempo real',
      'Historial de transacciones',
      'Recargas digitales',
      'Gestión de credenciales',
    ],
  },
  {
    num: '02',
    title: 'Auto-enrolamiento',
    icon: UserPlus,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:border-emerald-300',
    iconBg: 'bg-emerald-100',
    description:
      'Registro y vinculación digital de tarjetas mediante NFC o código de Cívica al Portador.',
    features: [
      'Lectura NFC móvil',
      'Registro por código',
      'Vinculación remota',
      'Eliminación de filas',
    ],
  },
  {
    num: '03',
    title: 'Credencial móvil',
    icon: Nfc,
    color: 'bg-purple-50 text-purple-600 border-purple-100 group-hover:border-purple-300',
    iconBg: 'bg-purple-100',
    description:
      'Evaluación del uso de dispositivos móviles compatibles como medio de interacción con los validadores.',
    features: [
      'NFC nativo (Tap-and-Go)',
      'Token de dispositivo',
      'Gestión remota',
      'Compatibilidad multiplataforma',
    ],
  },
  {
    num: '04',
    title: 'MaaS',
    icon: Globe,
    color: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:border-amber-300',
    iconBg: 'bg-amber-100',
    description:
      'Evolución futura hacia integración con billeteras digitales y otros servicios de movilidad.',
    features: [
      'Billeteras digitales',
      'Interoperabilidad',
      'Ecosistema abierto',
      'Movilidad como Servicio',
    ],
  },
];

export default function ProposalSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="propuesta" className="relative py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
            Propuesta
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Un ecosistema Cívica diseñado para evolucionar
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Cuatro módulos interconectados que proponen una ruta de
            modernización progresiva del sistema Cívica.
          </p>
        </motion.div>

        {/* Module cards */}
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.num}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: i * 0.12 }}
                className={`group relative bg-white rounded-2xl border p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${mod.color}`}
              >
                {/* Number watermark */}
                <span className="absolute top-4 right-6 text-6xl font-black text-slate-50 select-none group-hover:text-slate-100 transition-colors">
                  {mod.num}
                </span>

                {/* Icon */}
                <div
                  className={`relative z-10 h-12 w-12 rounded-xl ${mod.iconBg} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Title */}
                <h3 className="relative z-10 text-xl font-bold text-slate-900 mb-2">
                  {mod.title}
                </h3>

                {/* Description */}
                <p className="relative z-10 text-sm text-slate-500 leading-relaxed mb-4">
                  {mod.description}
                </p>

                {/* Features */}
                <ul className="relative z-10 space-y-2">
                  {mod.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <Check className="h-3.5 w-3.5 text-metro-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
