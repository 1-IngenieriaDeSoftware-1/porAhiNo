/**
 * Componente: Footer
 *
 * Pie de página con aviso de privacidad (Ley 1581 de 2012)
 * y links relevantes.
 */

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <p>© {new Date().getFullYear()} porAhiNo. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <a href="/privacidad" className="hover:text-primary-600 transition-colors">
            Política de Privacidad
          </a>
          <span>·</span>
          <a href="/terminos" className="hover:text-primary-600 transition-colors">
            Términos de Uso
          </a>
        </div>
        <p className="text-xs text-gray-300">
          Datos protegidos bajo Ley 1581 de 2012
        </p>
      </div>
    </footer>
  );
}
