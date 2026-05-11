/**
 * Web Push 구독 헬퍼.
 *
 * 사용 흐름:
 *   1. `isPushSupported()` 체크
 *   2. `getSubscriptionStatus()` — 현재 권한/구독 상태
 *   3. `subscribeToPush()` — 권한 요청 + PushManager.subscribe + 백엔드 등록
 *   4. `unsubscribeFromPush()` — 구독 해제 + 백엔드 알림
 *
 * 백엔드 endpoint:
 *   GET    /api/push/public-key
 *   POST   /api/push/subscribe
 *   DELETE /api/push/subscribe
 */

import apiClient from '../api/client';

export type PushStatus = 'unsupported' | 'denied' | 'granted' | 'default' | 'subscribed';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function getSubscriptionStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';
  const permission = Notification.permission;
  if (permission === 'denied') return 'denied';
  const reg = await getRegistration();
  if (!reg) return permission;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return 'subscribed';
  return permission;
}

async function fetchPublicKey(): Promise<string> {
  const res = await apiClient.get('/push/public-key');
  return res.data.public_key as string;
}

function subscriptionToPayload(sub: PushSubscription) {
  // PushSubscription.toJSON() 결과 — endpoint + keys.{p256dh,auth}
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint!,
    keys: {
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
    },
    user_agent: navigator.userAgent,
  };
}

export async function subscribeToPush(): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';
  const reg = await getRegistration();
  if (!reg) return 'unsupported';

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return permission as PushStatus;

  const existing = await reg.pushManager.getSubscription();
  let sub: PushSubscription | null = existing;
  if (!sub) {
    const publicKey = await fetchPublicKey();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await apiClient.post('/push/subscribe', subscriptionToPayload(sub));
  return 'subscribed';
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }
  try {
    await apiClient.delete('/push/subscribe', { data: { endpoint } });
  } catch {
    /* ignore — 이미 만료된 구독일 수 있음 */
  }
}

export async function sendTestPush(): Promise<{ sent: number; expired: number }> {
  const res = await apiClient.post('/push/test');
  return res.data;
}
