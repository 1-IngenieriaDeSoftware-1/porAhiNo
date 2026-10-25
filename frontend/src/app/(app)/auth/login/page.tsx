'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { ROUTES } from '@/lib/routes';
import { apiErrorMessage } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const { error: toastError, success } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const me = await login(email, password);
      success('Sesión iniciada');
      router.push(me.rol === 'admin' ? ROUTES.admin : ROUTES.home);
    } catch (err: unknown) {
      toastError(apiErrorMessage(err, 'No se pudo iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="card w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700">porAhiNo</h1>
          <p className="text-gray-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>
        <form className="space-y-4" id="form-login" onSubmit={onSubmit}>
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
            autoComplete="current-password"
            required
          />
          <Button id="btn-login" type="submit" className="w-full" loading={loading}>
            Iniciar sesión
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link href={ROUTES.registro} className="text-primary-700 font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
