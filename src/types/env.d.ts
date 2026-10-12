/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly APP_VERSION: string
    readonly PACKAGE_NAME: string
}
  
interface ImportMeta {
  readonly env: ImportMetaEnv
}
