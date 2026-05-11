/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
/**
 * GANADI Service Worker (injectManifest mode)
 *
 * - precaching: vite-plugin-pwa 가 자동으로 self.__WB_MANIFEST 를 채워준다.
 * - runtime caching: 기존 workbox 설정과 동일한 정책을 직접 등록.
 * - web push: push / notificationclick 이벤트 처리.
 */

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// ---------------------------------------------------------------------------
// Precache
// ---------------------------------------------------------------------------
precacheAndRoute(self.__WB_MANIFEST ?? []);

// ---------------------------------------------------------------------------
// Runtime caching (기존 workbox 자동 설정과 동일)
// ---------------------------------------------------------------------------
registerRoute(
  ({ url }) => /\/api\//.test(url.pathname),
  new NetworkFirst({
    cacheName: 'ganadi-api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 5 }),
    ],
  }),
);

registerRoute(
  ({ url }) => /(dapi|t1)\.kakao(cdn)?\.com/.test(url.hostname),
  new StaleWhileRevalidate({
    cacheName: 'kakao-maps-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  }),
);

registerRoute(
  ({ url }) =>
    /cdn\.jsdelivr\.net/.test(url.hostname) ||
    /fonts\.(googleapis|gstatic)\.com/.test(url.hostname),
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
);

// ---------------------------------------------------------------------------
// SW lifecycle — 새 버전 활성화 즉시
// ---------------------------------------------------------------------------
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ---------------------------------------------------------------------------
// Web Push
// ---------------------------------------------------------------------------
type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  type?: string;
};

self.addEventListener('push', (event) => {
  let payload: PushPayload = {};
  try {
    payload = (event.data?.json() as PushPayload) ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }
  const title = payload.title ?? 'GANADI 알림';
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag,
    data: { url: payload.url ?? '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url ?? '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await (client as WindowClient).navigate(targetUrl);
            } catch {
              /* ignore navigation errors */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

export {};
