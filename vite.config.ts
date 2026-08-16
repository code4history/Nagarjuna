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

export default defineConfig({
  base: './',  // GitHub Pages用の相対パス設定
  build: isPackageBuild
    ? {
        lib: {
          entry: {
            'nagarjuna': resolve(__dirname, 'src/index.ts'),
            'nagarjuna-ime': resolve(__dirname, 'src/ime.ts'),
          },
          formats: ['es','cjs'],
          name: 'nagarjuna'
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
  // tsconfig の include は ["src","tests"] であり、dts プラグインの entry root が
  // リポジトリルートになる ∴ 型定義が dist/src/ へ出て package.json の types と食い違う。
  // 生成対象を src に限ることで dist/index.d.ts / dist/ime.d.ts が正しい位置に出る。
  plugins: [dts({ include: ['src'] })],
  json: {
    stringify: true // JSONをstringifyして含める
  },
  server: {
    open: true,
    strictPort: true
  },
  // publicDir は Pages（SPA）ビルドのための機構である。package ビルドの成果物は
  // dist/*.{js,cjs,d.ts} だけであり、icons / index.html / demo 用書体は配布物に要らない。
  // files: ["dist"] を絞り込むのではなく、dist にそもそも入れない側で直す。
  publicDir: isPackageBuild ? false : 'public',
  appType: 'spa',
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(packageJson.version)
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  assetsInclude: ['assets/**/*']
});