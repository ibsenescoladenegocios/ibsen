import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O build gera index.html + assets/ na RAIZ do repositório (que é a pasta publicada na Hostinger).
// Em desenvolvimento, /api e /uploads são encaminhados ao PHP local (php -S localhost:8000 -t ..).
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: '..',
    emptyOutDir: false,
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/images': 'http://localhost:8000',
    },
  },
});
