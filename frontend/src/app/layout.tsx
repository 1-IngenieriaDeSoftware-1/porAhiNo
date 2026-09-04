import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/providers/AuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'porAhiNo — Pico y Placa Colombia',
    template: '%s | porAhiNo',
  },
  description:
    'Consulta restricciones de Pico y Placa por municipio y placa vehicular en Colombia.',
  keywords: ['pico y placa', 'restricción vehicular', 'Colombia', 'tránsito'],
  authors: [{ name: 'porAhiNo Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'porAhiNo',
  },
  openGraph: {
    title: 'porAhiNo — Pico y Placa Colombia',
    description: 'Consulta tu restricción de Pico y Placa en tiempo real',
    type: 'website',
    locale: 'es_CO',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.className}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
