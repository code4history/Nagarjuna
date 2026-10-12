import { defineConfig, configDefaults } from 'vitest/config';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// 実行時に出すパッケージ名（vite.config.ts の define と同じ値。nov26-m3-t2）
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  define: {
    'import.meta.env.PACKAGE_NAME': JSON.stringify(packageJson.name)
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost'
      }
    },
    setupFiles: ['./tests/setup.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
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