import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  plugins: [react()],
  server: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:4174',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    'process.env': {}
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
