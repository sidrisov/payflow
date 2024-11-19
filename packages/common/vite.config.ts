import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve('src/index.ts'),
      name: '@payflow/common',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['viem'],
      output: {
        globals: {
          viem: 'viem'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
