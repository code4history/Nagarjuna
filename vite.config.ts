import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// package.json を読み込む
const packageJson = JSON.parse(
  readFileSync('./package.json', 'utf-8')
);

// npm package用のビルドの時のみ単一エントリーポイント
const isPackageBuild = process.env.BUILD_MODE === 'package';
console.log(`${process.env.BUILD_MODE}`);

export default defineConfig({
  base: './',  // GitHub Pages用の相対パス設定
  build: isPackageBuild
    ? {
        lib: {
          entry: {
            'index': resolve(__dirname, 'src/entry-viewer.ts'),
            'ime': resolve(__dirname, 'src/entry-ime.ts'),
          },
          formats: ['es']
        }
      }
    : {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html')
          },
          output: {
            entryFileNames: 'assets/[name].[hash].js',
            chunkFileNames: 'assets/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash][extname]'
          }
        }
      },
  plugins: [dts()],
  json: {
    stringify: true // JSONをstringifyして含める
  },
  server: {
    port: 8888,  // 既存のwebpack devServerと同じポート
    open: true,
    strictPort: true
  },
  publicDir: 'public',
  appType: 'spa',  // SPAとして扱う
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(packageJson.version)
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  assetsInclude: ['**/*.woff', '**/*.woff2']
});