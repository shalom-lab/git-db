import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
        // 注意：SQLite WASM 文件现在放在 public/ 目录中，Vite 会自动复制到 dist/
        // 这些文件已经手动修改过，确保 OPFS Worker 使用 type: 'module'
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
