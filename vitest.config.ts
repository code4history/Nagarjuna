import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost'
      }
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 1000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }, 
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});