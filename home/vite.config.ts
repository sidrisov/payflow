import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5172 },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    conditions: ['mui-modern', 'module', 'browser', 'development|production']
  }
});
