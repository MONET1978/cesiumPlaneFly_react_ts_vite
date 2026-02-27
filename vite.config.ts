import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

/**
 * Vite 配置文件
 * 用于配置 React + TypeScript + Cesium 项目的构建和开发环境
 */
export default defineConfig({
  plugins: [react(), cesium()],
})
