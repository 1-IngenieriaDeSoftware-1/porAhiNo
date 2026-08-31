'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ShieldCheck,
  Smartphone,
  KeyRound,
  Lock,
  FileSearch,
  Database,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const SECURITY_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Autenticación multifactor',
    description:
      'Mecanismos de verificación de identidad en múltiples capas para proteger el acceso a la cuenta.',
    color: 'bg-metro-50 text-metro-600',
  },
  {
    icon: Smartphone,
    title: 'Gestión de dispositivos',
    description:
      'Control y administración de los dispositivos autorizados para operar con la cuenta Cívica.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: KeyRound,
    title: 'Tokenización',
    description:
      'Representación segura de las credenciales mediante tokens que no exponen datos sensibles.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Lock,
    title: 'Cifrado',
    description:
      'Protección de datos en tránsito y en reposo mediante estándares de cifrado reconocidos.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: FileSearch,
    title: 'Auditoría',
    description:
      'Registro de eventos y trazabilidad de operaciones para monitoreo y cumplimiento.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Database,
    title: 'Protección de datos',
    description:
      'Políticas y mecanismos de resguardo de la información personal del usuario.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: AlertTriangle,
    title: 'Prevención de fraude',
    description:
      'Detección de patrones anómalos y mecanismos de protección contra uso no autorizado.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: RefreshCw,
    title: 'Recuperación de credenciales',
    description:
      'Procedimientos seguros para restablecer el acceso a la cuenta en caso de pérdida o compromiso.',
    color: 'bg-teal-50 text-teal-600',
  },
];

export default function SecuritySection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} id="seguridad" className="relative py-24 sm:py-32 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-sm font-semibold text-metro-600 uppercase tracking-wider">
            Seguridad
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Digitalizar también significa proteger
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            La propuesta contempla consideraciones de seguridad como parte
            integral del diseño del ecosistema.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SECURITY_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`h-11 w-11 rounded-xl ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {card.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 text-center text-sm text-slate-400 italic max-w-xl mx-auto"
        >
          Las tecnologías y protocolos específicos dependerán de la evaluación
          técnica y las capacidades de la infraestructura existente.
        </motion.p>
      </div>
    </section>
  );
}
