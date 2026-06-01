-- =====================================================
-- KuryeApp Supabase Schema with Multi-User Support
-- =====================================================

-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  "taxOffice" text,
  "taxNumber" text,
  address text,
  balance numeric DEFAULT 0
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "customerId" uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  "customerName" text NOT NULL,
  "pickupLocation" text,
  "deliveryLocation" text,
  "vehicleType" text,
  amount numeric NOT NULL,
  "courierName" text,
  "courierPlate" text,
  "courierPhone" text,
  note text,
  status text DEFAULT 'Bekliyor',
  date text NOT NULL
);

-- Create Cash Transactions Table (Premium: Kasa Takibi)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric NOT NULL,
  description text,
  date text NOT NULL,
  "relatedOrderId" uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  "relatedCustomerId" uuid REFERENCES public.customers(id) ON DELETE SET NULL
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Each user can only access their own data
-- =====================================================

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- Customers RLS
CREATE POLICY "Users can view own customers" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON public.customers
  FOR DELETE USING (auth.uid() = user_id);

-- Orders RLS
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own orders" ON public.orders
  FOR DELETE USING (auth.uid() = user_id);

-- Cash Transactions RLS
CREATE POLICY "Users can view own cash" ON public.cash_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cash" ON public.cash_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cash" ON public.cash_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cash" ON public.cash_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- MIGRATION: Run these if tables already exist
-- =====================================================
-- ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS due_date text;
