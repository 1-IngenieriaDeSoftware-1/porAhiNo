import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de privacidad',
};

export default function PrivacidadPage() {
  return (
    <main className="px-4 py-10 max-w-3xl mx-auto prose prose-slate">
      <h1 className="text-3xl font-bold text-primary-700 mb-4">Política de privacidad</h1>
      <p className="text-gray-600 mb-4">
        porAhiNo trata datos personales bajo la Ley 1581 de 2012. Solo se solicitan los datos
        mínimos para operar el servicio: correo, contraseña (almacenada con Bcrypt, nunca en
        texto plano) y placas de vehículos que el conductor decida registrar.
      </p>
      <p className="text-gray-600 mb-4">
        La consulta de Pico y Placa puede hacerse sin cuenta, enviando únicamente placa y
        municipio. No se procesan pagos ni se integra con SIMIT o fotomultas (fuera de alcance
        del SRS).
      </p>
      <p className="text-gray-600">
        En producción el tráfico viaja por HTTPS (TLS 1.3). El tratamiento se limita al entorno
        académico del proyecto.
      </p>
    </main>
  );
}
