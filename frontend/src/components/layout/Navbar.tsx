'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/lib/routes';

const NAV_PUBLIC = [
  { href: ROUTES.consulta, label: 'Consultar', id: 'nav-consulta' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAdmin, logout, loading } = useAuth();

  const links = [
    ...NAV_PUBLIC,
    ...(user ? [{ href: ROUTES.vehiculos, label: 'Mis vehículos', id: 'nav-vehiculos' }] : []),
    ...(isAdmin ? [{ href: ROUTES.admin, label: 'Admin', id: 'nav-admin' }] : []),
  ];

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm" role="navigation" aria-label="Navegación principal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={ROUTES.home} id="nav-brand" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🚗
            </span>
            <span className="font-bold text-primary-700 text-lg">porAhiNo</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                id={link.id}
                className={`font-medium transition-colors ${
                  pathname === link.href ? 'text-primary-700' : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!loading && user ? (
              <button type="button" onClick={logout} className="text-gray-600 hover:text-primary-600 font-medium">
                Cerrar sesión
              </button>
            ) : (
              <Link href={ROUTES.login} id="nav-login" className="btn-primary py-2 px-4">
                Iniciar sesión
              </Link>
            )}
          </div>

          <button
            type="button"
            id="nav-hamburger"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="block py-2 text-gray-700 font-medium"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!loading && user ? (
              <button type="button" onClick={() => { logout(); setOpen(false); }} className="block py-2 text-gray-700 font-medium">
                Cerrar sesión
              </button>
            ) : (
              <Link href={ROUTES.login} className="block py-2 text-primary-700 font-semibold" onClick={() => setOpen(false)}>
                Iniciar sesión
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
