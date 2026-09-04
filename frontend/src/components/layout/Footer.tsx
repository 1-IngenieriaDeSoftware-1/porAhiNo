import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <p>© {new Date().getFullYear()} porAhiNo. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <Link href={ROUTES.privacidad} className="hover:text-primary-600 transition-colors">
            Política de Privacidad
          </Link>
        </div>
        <p className="text-xs text-gray-300">Datos personales tratados bajo Ley 1581 de 2012</p>
      </div>
    </footer>
  );
}
