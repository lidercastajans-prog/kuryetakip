import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

// Toast helper for the store (Alert is a no-op on react-native-web).
const notify = (message, type = 'error') => useToast.getState().showToast(message, type);

export const useStore = create((set, get) => ({
  customers: [],
  orders: [],
  cashTransactions: [],
  isLoading: false,

  // --- BAŞLANGIÇTA VERİLERİ ÇEK ---
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Müşterileri Çek
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Siparişleri Çek
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Kasa Hareketlerini Çek
      const { data: cashData, error: cashError } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (cashError) throw cashError;

      set({
        customers: customersData || [],
        orders: ordersData || [],
        cashTransactions: cashData || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Veri çekme hatası:', error.message);
      notify('Veriler buluttan alınamadı.');
      set({ isLoading: false });
    }
  },

  // --- MÜŞTERİ İŞLEMLERİ ---
  addCustomer: async (customerData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const newCustomer = {
        ...customerData,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomer])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        customers: [data, ...state.customers],
      }));
    } catch (error) {
       console.error(error);
       notify('Müşteri buluta kaydedilemedi.');
    }
  },

  updateCustomerDueDate: async (customerId, dueDate) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ due_date: dueDate })
        .eq('id', customerId);
      if (error) throw error;
      set(state => ({
        customers: state.customers.map(c =>
          c.id === customerId ? { ...c, due_date: dueDate } : c
        ),
      }));
    } catch (error) {
      console.error(error);
      notify('Vade tarihi güncellenemedi.');
    }
  },

  // Müşteriye özel kayıtlı alış adresleri (Google konum linki). JSONB dizi.
  updateCustomerPickupAddresses: async (customerId, addresses) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ pickup_addresses: addresses })
        .eq('id', customerId);
      if (error) throw error;
      set(state => ({
        customers: state.customers.map(c =>
          c.id === customerId ? { ...c, pickup_addresses: addresses } : c
        ),
      }));
    } catch (error) {
      console.error(error);
      notify('Adres kaydedilemedi.');
    }
  },

  deleteCustomer: async (customerId) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      set((state) => ({
        customers: state.customers.filter((c) => c.id !== customerId),
        orders: state.orders.filter((o) => o.customerId !== customerId),
      }));
      notify('Müşteri başarıyla silindi.', 'success');
    } catch (error) {
      console.error(error);
      notify('Müşteri silinemedi.');
    }
  },

  // --- SİPARİŞ İŞLEMLERİ ---
  addOrder: async (orderData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const newOrder = {
        ...orderData,
        status: 'Bekliyor',
        date: orderData.date || new Date().toISOString(),
        user_id: userId,
      };

      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (orderError) throw orderError;

      // Bakiye (borç) artık orders − tahsilat'tan türetiliyor; sayaç tutulmuyor.
      set((state) => ({
        orders: [insertedOrder, ...state.orders],
      }));
      return true;
    } catch (error) {
       console.error('addOrder error:', error);
       notify('Sipariş iletilemedi: ' + (error.message || ''));
       throw error;
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ),
      }));
    } catch (error) {
       console.error(error);
       notify('Durum güncellenemedi.');
    }
  },

  deleteOrder: async (orderId) => {
    try {
      const order = get().orders.find((o) => o.id === orderId);
      if (!order) return;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      set((state) => ({
        orders: state.orders.filter((o) => o.id !== orderId),
      }));

      notify('Sipariş silindi.', 'success');
    } catch (error) {
      console.error(error);
      notify('Sipariş silinemedi.');
    }
  },

  editOrder: async (orderId, updatedData) => {
    try {
      const oldOrder = get().orders.find((o) => o.id === orderId);
      if (!oldOrder) return;

      const { error: orderError } = await supabase
        .from('orders')
        .update(updatedData)
        .eq('id', orderId);

      if (orderError) throw orderError;

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, ...updatedData } : o
        ),
      }));
      return true;
    } catch (error) {
      console.error('editOrder error:', error);
      notify('Sipariş düzenlenemedi: ' + (error.message || ''));
      throw error;
    }
  },

  // --- ÖDEME (TAHSİLAT) İŞLEMLERİ ---
  addPayment: async (customerId, amount) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const customer = get().customers.find((c) => c.id === customerId);

      // Tahsilatı kasa gelir kaydı olarak işle — bakiye buradan (orders − tahsilat) türetilir.
      const cashEntry = {
        user_id: userId,
        type: 'income',
        category: 'Tahsilat',
        amount: Number(amount),
        description: `${customer?.name || 'Müşteri'} - Tahsilat`,
        date: new Date().toISOString(),
        relatedCustomerId: customerId,
      };

      const { data: cashData, error: cashError } = await supabase
        .from('cash_transactions')
        .insert([cashEntry])
        .select()
        .single();

      if (cashError) throw cashError;

      set((state) => ({
        cashTransactions: cashData
          ? [cashData, ...state.cashTransactions]
          : state.cashTransactions,
      }));
    } catch (error) {
       console.error(error);
       notify('Ödeme işlenemedi.');
    }
  },

  // --- KASA İŞLEMLERİ (PREMIUM) ---
  addCashTransaction: async (transactionData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const newTransaction = {
        ...transactionData,
        user_id: userId,
        date: transactionData.date || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('cash_transactions')
        .insert([newTransaction])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        cashTransactions: [data, ...state.cashTransactions],
      }));

      return true;
    } catch (error) {
      console.error(error);
      notify('Kasa kaydı oluşturulamadı.');
      return false;
    }
  },

  deleteCashTransaction: async (transactionId) => {
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      set((state) => ({
        cashTransactions: state.cashTransactions.filter((t) => t.id !== transactionId),
      }));

      notify('Kasa kaydı silindi.', 'success');
    } catch (error) {
      console.error(error);
      notify('Kasa kaydı silinemedi.');
    }
  },
}));
