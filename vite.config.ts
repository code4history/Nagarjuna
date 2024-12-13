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
  build: {
    lib: isPackageBuild
      ? {
          entry: {
            'nagarjuna.ime': resolve(__dirname, 'src/entry-ime.ts'),
            'nagarjuna.viewer': resolve(__dirname, 'src/entry-viewer.ts'),
          },
        }
      : {
        entry: {
            'nagarjuna.ime': resolve(__dirname, 'src/entry-ime.ts'),
            'nagarjuna.viewer': resolve(__dirname, 'src/entry-viewer.ts'),
            'nagarjuna.demo': resolve(__dirname, 'src/demo.ts')
          },
          formats: ['es']
        },
  },
  plugins: [dts()],
  json: {
    stringify: true // JSONをstringifyして含める
  },
  server: {
    port: 8888,  // 既存のwebpack devServerと同じポート
    open: true   // 起動時にブラウザを開く
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