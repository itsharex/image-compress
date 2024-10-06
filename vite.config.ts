import path from 'node:path'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  base: './',
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    // 拆分代码块
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React相关库打包在一起
          'react-vendor': ['react', 'react-dom'],
          // 将Ant Design相关库打包在一起
          'antd-vendor': ['antd', '@ant-design/icons']
        }
      }
    }
  },
  plugins: [
    react(),
    UnoCSS(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['sharp']
            }
          }
        }
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.ts')
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer:
        process.env.NODE_ENV === 'test'
          ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
            undefined
          : {}
    })
  ]
}))
