/** @type {import('next').NextConfig} */
const isCapacitor = process.env.CAPACITOR_BUILD === '1';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // PWA en web; en Capacitor el shell nativo ya es “installable”
  disable: process.env.NODE_ENV === 'development' || isCapacitor,
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,
  // Docker/web: standalone | Android (Capacitor): export estático → out/
  output: isCapacitor ? 'export' : 'standalone',
  images: {
    remotePatterns: [],
    unoptimized: isCapacitor,
  },
  ...(isCapacitor
    ? {
        trailingSlash: true,
      }
    : {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'X-XSS-Protection', value: '1; mode=block' },
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
                },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              ],
            },
          ];
        },
      }),
};

module.exports = withPWA(nextConfig);
