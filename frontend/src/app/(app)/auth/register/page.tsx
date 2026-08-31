'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES } from '@/lib/routes';

export default function RegisterPage() {
  const { registro } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registro(email, password);
      router.push(ROUTES.vehiculos);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="card w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700">Crear cuenta</h1>
          <p className="text-gray-500 mt-1">Para guardar tus vehículos y consultar más rápido</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            id="email"
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            helperText="Mínimo 8 caracteres"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Registrarme
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href={ROUTES.login} className="text-primary-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
