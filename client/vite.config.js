import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Also reachable from other devices on the same network while developing
    host: true,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) needs a function: split big libraries into cacheable vendor chunks
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/]node_modules[\\/](@reduxjs|react-redux|redux|immer|reselect)[\\/]/.test(id)) return 'redux';
          if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/.test(id)) return 'charts';
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils|swiper)[\\/]/.test(id)) return 'ui';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
    css: false,
  },
});
