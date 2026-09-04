'use client';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-white font-bold tracking-widest text-sm mb-1">
              CÍVICA DIGITAL
            </span>
            <span className="text-slate-400 text-sm">
              Propuesta técnica independiente
            </span>
            <span className="text-slate-500 text-xs mt-1">
              Caso de referencia: M00746243
            </span>
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <span className="text-slate-300 text-sm font-medium">
              Daniel Montiel
            </span>
            <span className="text-slate-400 text-xs mt-1">
              Ingeniería de Sistemas e Informática · UPB
            </span>
            <span className="text-slate-500 text-xs mt-1">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800/50">
          <p className="text-[11px] text-slate-500 text-center max-w-3xl mx-auto leading-relaxed">
            Esta iniciativa es una propuesta independiente elaborada con fines
            académicos y de evaluación técnica. No representa un producto oficial
            del Metro de Medellín ni implica su adopción, aprobación o
            patrocinio. Todos los conceptos, interfaces y arquitecturas
            presentados son de carácter ilustrativo.
          </p>
        </div>
      </div>
    </footer>
  );
}
