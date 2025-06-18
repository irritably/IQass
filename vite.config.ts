import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: process.env.NODE_ENV === 'development', // Enable source maps in development
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          utils: ['exifr', 'lucide-react']
        }
      }
    }
  },
  server: {
    fs: {
      strict: false
    }
  },
  define: {
    // Enable performance monitoring in development
    __DEV_PERFORMANCE__: process.env.NODE_ENV === 'development',
    __DEV_DEBUG__: process.env.NODE_ENV === 'development'
  },
  optimizeDeps: {
    include: ['exifr', 'lucide-react']
  }
});