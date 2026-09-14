import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — сборка работает из любой подпапки (GitHub Pages, Netlify, VPS)
export default defineConfig({
  base: './',
  plugins: [react()],
  // allowedHosts: dev-сервер Vite проверяет Host-заголовок и иначе отклоняет
  // запросы через туннель (ngrok/cloudflared), который нужен для отладки в Telegram.
  server: { host: true, allowedHosts: true },
});
