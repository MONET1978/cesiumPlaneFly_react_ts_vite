/// <reference types="vite/client" />

/**
 * Vite 环境变量类型声明
 */
interface ImportMetaEnv {
  /** Cesium Ion 访问令牌 */
  readonly VITE_CESIUM_ION_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
