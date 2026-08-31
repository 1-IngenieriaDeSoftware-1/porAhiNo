import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cívica Digital — Propuesta de Transformación',
  description:
    'Propuesta técnica de modernización y digitalización integral del sistema Cívica del Metro de Medellín.',
  openGraph: {
    title: 'Cívica Digital — Propuesta de Transformación',
    description:
      'Propuesta técnica de modernización del ecosistema Cívica. Caso M00746243.',
    type: 'website',
    locale: 'es_CO',
  },
};

export default function CivicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
