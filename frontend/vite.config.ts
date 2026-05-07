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
      registerType: 'prompt',
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
        // Vite 5 + workbox-build 조합에서 terser worker 가 hang 되는
        // 알려진 이슈 회피 — SW 자체 minify 비활성. (앱 번들은 vite 가 minify)
        mode: 'development',
        // API 호출은 캐시하지 않고 항상 네트워크 우선 (오프라인은 회피용 캐시만)
        runtimeCaching: [
          {
            // 백엔드 API — NetworkFirst
            urlPattern: /^https?:\/\/[^/]+\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ganadi-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 5,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 카카오맵 SDK / 타일 — StaleWhileRevalidate
            urlPattern: /^https:\/\/(dapi|t1)\.kakao(cdn)?\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'kakao-maps-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            // Pretendard / Google Fonts — CacheFirst (1년)
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*\.(css|woff2)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
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
    host: true, // LAN 휴대폰 접속 허용 (0.0.0.0)
    // dev 서버에서 /api, /uploads 를 백엔드로 프록시 — frontend 와 backend 를
    // 같은 origin 에서 쓰는 효과. ngrok 1 개로 둘 다 노출 가능.
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
    // ngrok / cloudflared 임시 도메인이 dev 서버에서 거부되지 않도록.
    allowedHosts: true,
  },
});
