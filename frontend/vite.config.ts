import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Web Push (`push`, `notificationclick` 이벤트) 를 워크박스 자동 SW 가
      // 제공하지 않으므로 injectManifest 모드로 전환하고 src/sw.ts 를 직접 작성.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
      ],
      manifest: {
        name: 'GANADI — 반려동물 안구 AI 스크리닝',
        short_name: 'GANADI',
        description:
          '반려동물 눈 사진 한 장으로 안구 질환을 AI 스크리닝하고, 인증 수의사와 연결합니다.',
        lang: 'ko',
        dir: 'ltr',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // injectManifest 모드에서는 globPatterns 만 사용 (runtimeCaching 은 sw.ts 안에서 직접 등록)
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
        // Vite 5 + esbuild 조합에서 SW 자체는 빠르게만 번들
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false, // 개발 중엔 SW 비활성 — HMR 충돌 방지
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': srcDir,
    },
  },
  server: {
    // true 와 동일하지만 Mac/LAN 에서 의도가 분명하도록 고정
    host: '0.0.0.0',
    port: 5173,
    // dev 서버에서 /api, /uploads 를 백엔드로 프록시 — frontend 와 backend 를
    // 같은 origin 에서 쓰는 효과. ngrok 1 개로 둘 다 노출 가능.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
    // ngrok / cloudflared 임시 도메인이 dev 서버에서 거부되지 않도록.
    allowedHosts: true,
  },
});
