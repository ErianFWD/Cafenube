import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const configured = env.VITE_API_PROXY_TARGET || env.VITE_API_URL;
  const target = new URL(configured?.startsWith('http') ? configured : 'http://127.0.0.1:3001');
  if (!['http:', 'https:'].includes(target.protocol))
    throw new Error('La dirección del backend debe utilizar HTTP o HTTPS.');
  // El servidor Node escucha en IPv4; evita resolver localhost como ::1.
  if (target.hostname === 'localhost') target.hostname = '127.0.0.1';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: target.origin,
          changeOrigin: false,
        },
      },
    },
  };
});
