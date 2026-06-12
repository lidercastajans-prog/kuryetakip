-- Müşteriye özel kayıtlı TESLİMAT adresleri (Google konum linki) + siparişe
-- iliştirilen teslim konumu. Alış adresleri (pickup_addresses / pickup_maps_url)
-- daha önce supabase_pickup_addresses.sql ile eklenmişti; bu dosya teslim tarafını ekler.
-- Supabase → SQL Editor'de bir kez çalıştır.

-- Her müşteri için birden çok kayıtlı teslimat adresi (JSONB dizi).
-- Öğe biçimi: { "id", "label", "mapsUrl", "province", "district", "mahalle" }
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS delivery_addresses jsonb DEFAULT '[]'::jsonb;

-- O siparişe iliştirilen teslim Google konum linki (varsa).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_maps_url text;
