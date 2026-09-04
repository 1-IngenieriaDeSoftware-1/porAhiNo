'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Problema', href: '#problema' },
  { label: 'Propuesta', href: '#propuesta' },
  { label: 'Auto-enrolamiento', href: '#auto-enrolamiento' },
  { label: 'Arquitectura', href: '#arquitectura' },
  { label: 'Seguridad', href: '#seguridad' },
  { label: 'Impacto', href: '#impacto' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Documento', href: '#documento' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('#inicio');

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    setScrolled(scrollY > 40);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(docHeight > 0 ? (scrollY / docHeight) * 100 : 0);

    // Determine active section
    const sections = NAV_LINKS.map((l) => l.href.slice(1));
    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(sections[i]);
      if (el && el.getBoundingClientRect().top <= 120) {
        setActiveSection(`#${sections[i]}`);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Reading progress */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent">
        <motion.div
          className="h-full bg-gradient-to-r from-metro-500 to-emerald-400"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Navbar */}
      <nav
        className={`fixed top-[3px] left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => scrollTo('#inicio')}
              className="flex items-center gap-2 group"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  scrolled ? 'bg-metro-600' : 'bg-white/20'
                }`}
              >
                <Smartphone
                  className={`h-4 w-4 ${scrolled ? 'text-white' : 'text-white'}`}
                />
              </div>
              <span
                className={`text-sm font-bold tracking-widest transition-colors ${
                  scrolled ? 'text-slate-900' : 'text-white'
                }`}
              >
                CÍVICA DIGITAL
              </span>
            </button>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className={`px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                    activeSection === link.href
                      ? scrolled
                        ? 'text-metro-600 bg-metro-50'
                        : 'text-white bg-white/15'
                      : scrolled
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => scrollTo('#documento')}
                className="ml-3 px-4 py-2 text-[13px] font-semibold rounded-lg bg-metro-600 text-white hover:bg-metro-700 transition-colors"
              >
                Ver propuesta
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label="Menú de navegación"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6 overflow-y-auto lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className={`w-full text-left px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                    activeSection === link.href
                      ? 'text-metro-600 bg-metro-50'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => scrollTo('#documento')}
                className="mt-4 w-full px-4 py-3 text-base font-semibold rounded-xl bg-metro-600 text-white hover:bg-metro-700 transition-colors"
              >
                Ver propuesta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
