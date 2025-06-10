import {fileURLToPath, URL} from 'node:url'

import {defineConfig,} from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
// const BASE = import.meta.env.VITE_BASE

// https://vite.dev/config/
export default defineConfig({
    base: "/",
    server: {
        port: 5454,
         proxy: {
        '/api': {
          target: 'https://helpapi.getechat.one', // 后台服务器地址
          changeOrigin: true, // 是否允许不同源
          secure: false, // 支持https
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },
    plugins: [
        vue(),
        // vueDevTools(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
})
