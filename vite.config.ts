import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      },
    },
    plugins: [react()],
    define: {
      // Sửa lại biến môi trường cho đúng (bạn đang bị lặp tên biến trong code cũ)
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // ĐÃ XÓA các dòng alias trỏ về https://esm.sh/...
      }
    },
    // ĐÃ XÓA phần optimizeDeps.exclude
  };
});