import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        ime: resolve(__dirname, 'src/entry-ime.ts'),
        viewer: resolve(__dirname, 'src/entry-viewer.ts')
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});