import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
              rename: 'sqlite3-opfs-async-proxy.mjs', // 重命名为 .mjs 以确保浏览器识别为 ES 模块
            },
          ],
          // 确保文件不被 Vite 处理，直接复制到输出目录
          structured: false,
        }),
        // 修复 Worker 文件：在加载 OPFS proxy 时添加 type: 'module'
        {
          name: 'fix-opfs-worker',
          writeBundle() {
            const workerPath = path.resolve(__dirname, 'dist/sqlite3-worker1.mjs');
            if (fs.existsSync(workerPath)) {
              let content = fs.readFileSync(workerPath, 'utf-8');
              // 查找并替换 Worker 创建代码，添加 type: 'module'
              // 匹配: new Worker(new URL(options.proxyUri, import.meta.url))
              // 替换为: new Worker(new URL(options.proxyUri, import.meta.url), { type: 'module' })
              content = content.replace(
                /new Worker\(new URL\(options\.proxyUri,\s*import\.meta\.url\)\)/g,
                "new Worker(new URL(options.proxyUri, import.meta.url), { type: 'module' })"
              );
              // 同时修复默认的 proxy URI 为 .mjs
              content = content.replace(
                /installOpfsVfs\.defaultProxyUri\s*=\s*"sqlite3-opfs-async-proxy\.js"/g,
                'installOpfsVfs.defaultProxyUri = "sqlite3-opfs-async-proxy.mjs"'
              );
              fs.writeFileSync(workerPath, content, 'utf-8');
              console.log('Fixed OPFS Worker to use type: module');
            }
          },
        },
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
