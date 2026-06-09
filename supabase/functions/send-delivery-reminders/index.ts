// Supabase Edge Function: send-delivery-reminders
//
// Invoked periodically (pg_cron, every ~10 min). Finds orders whose planned
// delivery time (due_date) has arrived, that aren't delivered and haven't been
// reminded yet, and sends a Web Push notification to the owner's subscribed
// browsers. Marks each order notified to avoid duplicates.
//
// Secrets required (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. mailto:you@domain)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:destek@kuryetakip.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  const nowIso = new Date().toISOString();

  // Orders whose reminder time has arrived, not delivered, not yet reminded.
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, user_id, customerName, pickupLocation, deliveryLocation, due_date, status')
    .lte('due_date', nowIso)
    .is('notified_at', null)
    .neq('status', 'Teslim Edildi')
    .not('due_date', 'is', null)
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  for (const o of orders ?? []) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', o.user_id);

    const payload = JSON.stringify({
      title: 'Planlı teslimat zamanı',
      body: `${o.customerName}: ${o.pickupLocation ?? '-'} → ${o.deliveryLocation ?? '-'}`,
      url: '/',
      tag: `order-${o.id}`,
    });

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          // Subscription expired/unsubscribed -> clean it up.
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }
    }

    await supabase.from('orders').update({ notified_at: new Date().toISOString() }).eq('id', o.id);
  }

  return new Response(JSON.stringify({ ok: true, matched: orders?.length ?? 0, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
