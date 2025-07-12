// Test configuration for Vite
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: './test-app.ts',
        edge: './test-edge.ts'
      },
      formats: ['es', 'cjs']
    },
    outDir: 'dist-vite',
    rollupOptions: {
      external: ['cross-log', 'cross-log/edge', 'cross-log/browser', 'cross-log/node', 'cross-log/next']
    }
  },
  resolve: {
    alias: {
      'cross-log': path.resolve(__dirname, '../../dist/index.js'),
      'cross-log/edge': path.resolve(__dirname, '../../dist/adapters/edge.js'),
      'cross-log/browser': path.resolve(__dirname, '../../dist/adapters/browser.js'),
      'cross-log/node': path.resolve(__dirname, '../../dist/adapters/node.js'),
      'cross-log/next': path.resolve(__dirname, '../../dist/adapters/next.js')
    }
  }
});