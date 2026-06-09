-- =====================================================
-- KuryeTakip — Web Push (planlı teslimat bildirimleri)
-- Supabase SQL Editor'da çalıştırın.
-- =====================================================

-- 1) Tarayıcı push abonelikleri (kullanıcı başına birden çok cihaz olabilir)
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Hangi siparişin hatırlatması gönderildi (mükerrer bildirimi önler)
alter table public.orders add column if not exists notified_at timestamptz;

-- =====================================================
-- 3) ZAMANLAMA (Edge Function deploy edildikten SONRA çalıştırın)
--    NOT: Yeni Supabase API anahtar sistemi aktifse, Edge Function ağ geçidi
--    eski anon/service_role JWT'lerini KABUL ETMEZ. Çağrıda mutlaka
--    'apikey' başlığında PUBLISHABLE anahtarı (sb_publishable_...) gönderilmeli.
--    Publishable anahtar gizli değildir; YOUR_PUBLISHABLE_KEY yerine yazın.
-- =====================================================
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule(
--   'delivery-reminders',
--   '*/10 * * * *',  -- her 10 dakikada bir
--   $$
--   select net.http_post(
--     url := 'https://nfdzipkrkphvkhybjuvw.supabase.co/functions/v1/send-delivery-reminders',
--     headers := jsonb_build_object(
--       'Content-Type','application/json',
--       'apikey','YOUR_PUBLISHABLE_KEY'
--     )
--   );
--   $$
-- );
--
-- Zamanlamayı kaldırmak için:  select cron.unschedule('delivery-reminders');
