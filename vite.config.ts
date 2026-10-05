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
            // トップ: 正式な IME（IMEManager / <ime-ui>）の demo（src/demo.ts）。
            // root に追跡ファイルとして置く（public/ だと変換されない。かつての deploy 時コピーは廃止）
            main: resolve(__dirname, 'index.html'),
            // 次トレインで公開予定の新 IME UI（NagaIME）のプレビュー（src/naga-demo.ts。API は非公開）
            naga: resolve(__dirname, 'naga.html')
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
  //
  // NagaIME（次トレインで公開予定の新 IME UI のプレビュー）は 1.1.0 の公開 API に含めない
  // （src/ime.ts から export しない）。どのエントリからも到達しない NagaIME 本体の型定義が
  // 配布物に紛れ込まないよう、その実装ファイルとデモの入口を型生成の対象から外す。
  // （naga-types.ts は生成辞書の型 internal-types.ts が参照するので対象に残す）
  plugins: [
    dts({
      include: ['src'],
      exclude: [
        'src/lib/ime/naga-ime.ts',
        'src/lib/ime/naga-styles.ts',
        'src/lib/ime/naga-dictionary.ts',
        'src/naga-demo.ts'
      ]
    })
  ],
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