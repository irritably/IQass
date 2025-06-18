import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // Disable source maps in production
  },
  server: {
    // Suppress source map warnings in development
    fs: {
      strict: false
    }
  }
});