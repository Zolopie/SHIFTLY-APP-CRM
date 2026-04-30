import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shiftly.workforceconnect',
  appName: 'Shiftly CRM',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    cleartext: true,
  },
};

export default config;
