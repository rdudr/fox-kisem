import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kisem.foxkisem',
  appName: 'Fox Kisem',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    allowNavigation: ['fox-kisem.vercel.app', '*.vercel.app'],
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
