/** Rutas de la PWA alineadas al mapa de historias (SRS §2). */

export const ROUTES = {
  home: '/',
  consulta: '/consulta',
  vehiculos: '/vehiculos',
  alertas: '/alertas',
  admin: '/admin',
  login: '/auth/login',
  registro: '/auth/register',
  privacidad: '/privacidad',
} as const;

export const TOKEN_STORAGE_KEY = 'porahino_access_token';
