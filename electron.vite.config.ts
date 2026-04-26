import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/main/index.ts'),
        external: ['active-win', 'discord-rpc'],
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/preload/index.ts'),
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    define: {
      global: 'globalThis',
      'process.env': '{}',
      'process.browser': 'true',
      'process.version': '"v18.0.0"',
    },
    resolve: {
      alias: {
        events: resolve(__dirname, 'node_modules/events'),
        util: resolve(__dirname, 'node_modules/util'),
        stream: resolve(__dirname, 'node_modules/readable-stream'),
      },
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html'),
      },
    },
    plugins: [react()],
  },
});
