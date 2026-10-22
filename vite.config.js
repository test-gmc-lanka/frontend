import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Integration tests (*.int.test.js) live in the tests repository. Locally it is cloned next to this one
// (../tests); CI checks it out elsewhere and sets INTEGRATION_TESTS_DIR.
const integrationTestsDir =
  process.env.INTEGRATION_TESTS_DIR ?? fileURLToPath(new URL('../tests/frontend', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Tests outside this folder must share this project's packages (e.g. the same axios instance)
    dedupe: ['axios'],
  },
  server: {
    port: 5173,
    fs: { allow: ['.', integrationTestsDir] },
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('\n[proxy error] Backend not reachable:', err.message);
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: [...configDefaults.include, `${integrationTestsDir.replaceAll('\\', '/')}/**/*.int.test.{js,jsx}`],
    alias: { '@frontend': fileURLToPath(new URL('./src', import.meta.url)) },
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
