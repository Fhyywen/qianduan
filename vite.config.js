import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 需要引入path模块

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 设置@别名指向src目录
      '~': path.resolve(__dirname, './public') // 可选：设置~别名指向public目录
    }
  }
})