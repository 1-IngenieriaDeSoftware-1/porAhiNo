import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Empaqueta el export estático de Next (`out/`) como WebView nativo Android.
 * Build: npm run build:android && npx cap sync android
 */
const config: CapacitorConfig = {
  appId: 'co.porahino.app',
  appName: 'porAhiNo',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // En debug con API local, descomenta y apunta al host:
    // url: 'http://10.0.2.2:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#345665',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#345665',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#345665',
  },
};

export default config;
