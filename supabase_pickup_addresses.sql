-- Müşteriye özel kayıtlı alış adresleri (Google konum linki) için şema eklemeleri.
-- Supabase → SQL Editor'de bir kez çalıştır.

-- Her müşteri için birden çok kayıtlı alış adresi (JSONB dizi).
-- Öğe biçimi: { "id", "label", "mapsUrl", "province", "district", "mahalle" }
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS pickup_addresses jsonb DEFAULT '[]'::jsonb;

-- O siparişe iliştirilen Google konum linki (varsa).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_maps_url text;
