import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  server: { host: '0.0.0.0', port: 8081, allowedHosts: true },
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  build: { outDir: 'client/dist' },
  publicDir: 'client/public',
  envPrefix: 'ENABLE_ACTUAL_',
});
