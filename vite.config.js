import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('\n[proxy error] Backend not reachable:', err.message);
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
      // Guideline target is 80% on new code; enforced per file as tests are added
      thresholds: {
        'src/utils/{formatters,deadline}.js': { lines: 80, branches: 80, functions: 80, statements: 80 },
        'src/components/common/Pagination.jsx': { lines: 80, branches: 80, functions: 80, statements: 80 },
        'src/api/axios.js': { lines: 80, branches: 80, functions: 80, statements: 80 },
      },
    },
  },
});
