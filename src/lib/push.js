// Web Push (PWA) — request permission, subscribe via the PushManager and store
// the subscription in Supabase so the daily/periodic Edge Function can send
// "planlı teslimat" reminders. Web only; no-ops elsewhere.
import { Platform } from 'react-native';
import { supabase } from './supabase';

// VAPID public key (safe to ship in the client). The matching PRIVATE key lives
// only as a Supabase Edge Function secret.
const VAPID_PUBLIC_KEY = 'BPCaJgYMUcdcMDepBQc5bloemtumONYhBT-W686F2UCRX_iL5K_q2w7mgCByrzjeO14oGtW-fTvpdX6K3MReO0E';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported() {
  return Platform.OS === 'web' && typeof window !== 'undefined'
    && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushPermission() {
  return (typeof Notification !== 'undefined') ? Notification.permission : 'unsupported';
}

export async function isPushEnabled() {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub && Notification.permission === 'granted';
  } catch {
    return false;
  }
}

export async function enablePush() {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'no-user' };

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  }, { onConflict: 'endpoint' });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function disablePush() {
  if (!isPushSupported()) return { ok: true };
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  } catch {
    /* ignore */
  }
  return { ok: true };
}
