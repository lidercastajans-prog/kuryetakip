import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

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
      Alert.alert('Hata', 'Veriler buluttan alınamadı.');
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
        balance: 0,
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
       Alert.alert('Kayıt Hatası', 'Müşteri buluta kaydedilemedi.');
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
      Alert.alert('Hata', 'Vade tarihi güncellenemedi.');
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
      Alert.alert('Başarılı', 'Müşteri başarıyla silindi.');
    } catch (error) {
      console.error(error);
      Alert.alert('Silme Hatası', 'Müşteri silinemedi.');
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
        date: new Date().toISOString(),
        user_id: userId,
      };

      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (orderError) throw orderError;

      // Müşterinin bakiyesini (borcunu) artırıyoruz
      const customer = get().customers.find((c) => c.id === orderData.customerId);
      const newBalance = (customer.balance || 0) + orderData.amount;

      const { error: updateError } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', orderData.customerId);

      if (updateError) throw updateError;

      set((state) => ({
        orders: [insertedOrder, ...state.orders],
        customers: state.customers.map((c) =>
          c.id === orderData.customerId ? { ...c, balance: newBalance } : c
        ),
      }));
    } catch (error) {
       console.error(error);
       Alert.alert('Sipariş Hatası', 'Sipariş buluta iletilemedi.');
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
       Alert.alert('Güncelleme Hatası', 'Durum bulut sunucusunda güncellenemedi.');
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

      const customer = get().customers.find((c) => c.id === order.customerId);
      const newBalance = (customer.balance || 0) - order.amount;

      const { error: updateError } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', order.customerId);

      if (updateError) throw updateError;

      set((state) => ({
        orders: state.orders.filter((o) => o.id !== orderId),
        customers: state.customers.map((c) =>
          c.id === order.customerId ? { ...c, balance: newBalance } : c
        ),
      }));

      Alert.alert('Başarılı', 'Sipariş silindi ve bakiye güncellendi.');
    } catch (error) {
      console.error(error);
      Alert.alert('Silme Hatası', 'Sipariş silinemedi.');
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

      if (updatedData.amount && updatedData.amount !== oldOrder.amount) {
        const diff = updatedData.amount - oldOrder.amount;
        const customer = get().customers.find((c) => c.id === oldOrder.customerId);
        const newBalance = (customer.balance || 0) + diff;

        const { error: updateError } = await supabase
          .from('customers')
          .update({ balance: newBalance })
          .eq('id', oldOrder.customerId);

        if (updateError) throw updateError;

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, ...updatedData } : o
          ),
          customers: state.customers.map((c) =>
            c.id === oldOrder.customerId ? { ...c, balance: newBalance } : c
          ),
        }));
      } else {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, ...updatedData } : o
          ),
        }));
      }

      Alert.alert('Başarılı', 'Sipariş güncellendi.');
    } catch (error) {
      console.error(error);
      Alert.alert('Güncelleme Hatası', 'Sipariş düzenlenemedi.');
    }
  },

  // --- ÖDEME (TAHSİLAT) İŞLEMLERİ ---
  addPayment: async (customerId, amount) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const customer = get().customers.find((c) => c.id === customerId);
      const newBalance = (customer.balance || 0) - Number(amount);

      const { error } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', customerId);

      if (error) throw error;

      // Otomatik kasa gelir kaydı oluştur
      const cashEntry = {
        user_id: userId,
        type: 'income',
        category: 'Tahsilat',
        amount: Number(amount),
        description: `${customer.name} - Tahsilat`,
        date: new Date().toISOString(),
        relatedCustomerId: customerId,
      };

      const { data: cashData, error: cashError } = await supabase
        .from('cash_transactions')
        .insert([cashEntry])
        .select()
        .single();

      if (cashError) console.error('Kasa kaydı hatası:', cashError);

      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === customerId ? { ...c, balance: newBalance } : c
        ),
        cashTransactions: cashData
          ? [cashData, ...state.cashTransactions]
          : state.cashTransactions,
      }));
    } catch (error) {
       console.error(error);
       Alert.alert('Tahsilat Hatası', 'Ödeme buluta işlenemedi.');
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
      Alert.alert('Kasa Hatası', 'Kasa kaydı oluşturulamadı.');
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

      Alert.alert('Başarılı', 'Kasa kaydı silindi.');
    } catch (error) {
      console.error(error);
      Alert.alert('Silme Hatası', 'Kasa kaydı silinemedi.');
    }
  },
}));
