import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      // preload相关
      targets: [
        {
          src: 'plugin.json',
          dest: '.'
        },
        {
          src: 'node_modules/clipboard-event/',
          dest: 'preload/node_modules'
        },
        {
          src: 'node_modules/electron-clipboard-ex/',
          dest: 'preload/node_modules'
        },
        {
          src: 'node_modules/node-gyp-build/',
          dest: 'preload/node_modules'
        },
        {
          src: 'preload.js',
          dest: 'preload/'
        },
        {
          src: 'src/assets/',
          dest: 'preload/src/'
        }
      ]
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, './src/index.html')
      }
    }
  },

  resolve: {
    alias: {
      // 确保路径解析正确
      '@': path.resolve(__dirname, 'src')
    }
  },

  // 添加 Electron 特殊处理
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    )
  },
  publicDir: path.resolve(__dirname, 'src/public') // logo复制
});
