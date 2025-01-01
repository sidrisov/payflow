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
      external: ['viem', 'permissionless', '@rhinestone/module-sdk', '@wagmi/core'],
      output: {
        globals: {
          viem: 'viem',
          permissionless: 'permissionless',
          '@rhinestone/module-sdk': '@rhinestone/module-sdk',
          '@wagmi/core': '@wagmi/core'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true }) as any]
});
