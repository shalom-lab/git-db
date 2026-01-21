import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
    return {
      base: mode === 'development' ? '/' : '/git-db/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        },
      },
      preview: {
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        },
      },
      plugins: [
        react(),
        // 关键：把 SQLite WASM 的核心文件复制到构建输出目录
        // 使用 Wrapped Worker 方式时，需要这些文件能被浏览器访问
        viteStaticCopy({
          targets: [
            {
              src: 'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm',
              dest: '.', // 复制到 dist 根目录
            },
            {
              src: 'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3-worker1.mjs',
              dest: '.', // Worker 文件（Wrapped Worker 方式需要）
            },
            {
              src: 'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3-opfs-async-proxy.js',
              dest: '.', // OPFS 代理文件（OPFS 模式需要）
            },
          ],
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      assetsInclude: ['**/*.wasm'],
      optimizeDeps: {
        exclude: ['@sqlite.org/sqlite-wasm'],
      },
      build: {
        target: 'esnext', // WASM 通常需要较新的 JS 特性
      },
    };
});
