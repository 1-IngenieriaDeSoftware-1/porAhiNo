import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        // Paleta formal: tinta + teal (movilidad / institucional)
        primary: {
          50: '#f3f7f8',
          100: '#e1ecef',
          200: '#c5dbe2',
          300: '#9bc0cc',
          400: '#6a9eaf',
          500: '#4f8396',
          600: '#3d697b',
          700: '#345665',
          800: '#2f4855',
          900: '#2a3e4a',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae3',
          300: '#b0b9c9',
          400: '#8593aa',
          500: '#667690',
          600: '#515e76',
          700: '#434d60',
          800: '#3a4251',
          900: '#1c2430',
        },
        danger: {
          light: '#fef2f2',
          DEFAULT: '#dc2626',
          dark: '#991b1b',
        },
        success: {
          light: '#ecfdf5',
          DEFAULT: '#059669',
          dark: '#047857',
        },
        warning: {
          light: '#fffbeb',
          DEFAULT: '#d97706',
          dark: '#b45309',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        toast: '0 10px 40px -12px rgba(28, 36, 48, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'toast-in': 'toastIn 0.35s ease-out',
        'toast-out': 'toastOut 0.4s ease-in forwards',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        toastIn: {
          '0%': { transform: 'translateY(-12px) translateX(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0) translateX(0)', opacity: '1' },
        },
        toastOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-8px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
