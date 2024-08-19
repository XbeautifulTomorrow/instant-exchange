// Plugins
import Components from 'unplugin-vue-components/vite';
import Vue from '@vitejs/plugin-vue';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import ViteFonts from 'unplugin-fonts/vite';
import mkcert from "vite-plugin-mkcert";
const pkg = require("./package.json");
import inject from '@rollup/plugin-inject'

// 时间戳
const timestamp = new Date().getTime();

// Utilities
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['axios']
  },
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify(),
    Components(),
    ViteFonts({
      google: {
        families: [{
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
    mkcert(),
  ],
  define: {
    'process.env': {},
    "process.platform": {},
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    // https: true
  },
  build: {
    outDir: 'dist', // 生成输出的根目录。如果该目录存在，则会在生成之前将其删除。 默认文件夹名称为dist
    assetsDir: 'public/assets',
    target: 'esnext',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境去掉控制台 console
        drop_debugger: true, // 生产环境去掉控制台 debugger 默认就是true
        dead_code: true, // 删除无法访问的代码 默认就是true
      },
      output: {
        //去掉注释内容
        comments: true,
      },
    },
    rollupOptions: {
      plugins: [
        inject({ Buffer: ['buffer/', 'Buffer'] })],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString()
          }
        },
        //入口文件输出配置
        entryFileNames: ({ name }) => {
          const { dependencies } = pkg;
          if (Object.keys(dependencies).indexOf(name) > -1) {
            return `assets/js/[name]-[hash].js`; // 第三方库不添加时间戳
          } else {
            return `assets/js/[name]-[hash]-${timestamp}.js`; // 自定义文件名，使用时间戳保证唯一性
          }
        },
        //代码分割后的文件输出配置
        chunkFileNames: ({ name }) => {
          const { dependencies } = pkg;
          if (Object.keys(dependencies).indexOf(name) > -1) {
            return `assets/js/[name]-[hash].js`; // 第三方库不添加时间戳
          } else {
            return `assets/js/[name]-[hash]-${timestamp}.js`; // 自定义文件名，使用时间戳保证唯一性
          }
        },
        //静态资源输出配置
        assetFileNames(assetInfo) {
          //css文件单独输出到css文件夹
          if (assetInfo.name.endsWith(".css")) {
            return `assets/css/[name]-[hash].css`;
          }
          //图片文件单独输出到img文件夹
          else if (
            [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].some((ext) =>
              assetInfo.name.endsWith(ext)
            )
          ) {
            return `assets/images/[name]-[hash].[ext]`;
          }
          //其他资源输出到assets文件夹
          else {
            return `assets/[name]-[hash].[ext]`;
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000, // 调整区块大小警告限制
  }
})
