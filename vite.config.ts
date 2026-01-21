import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
      plugins: [react()],
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
        rollupOptions: {
          external: (id) => {
            // 在浏览器中，importmap 会处理 '@sqlite.org/sqlite-wasm'
            // 但在构建时，我们可能需要保持它为外部依赖
            // 不过，对于浏览器构建，Vite 通常不会打包 node_modules
            return false;
          },
        },
      },
    };
});
