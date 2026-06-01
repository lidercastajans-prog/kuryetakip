import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Animated, RefreshControl, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { Package, DollarSign, Clock, ChevronRight, TrendingUp, Zap, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const AnimatedCard = ({ children, delay = 0, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const { orders, customers, fetchData, isLoading } = useStore();
  const { profile, signOut } = useAuthStore();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const today = new Date().toDateString();
  const todaysOrders = orders.filter(o => new Date(o.date).toDateString() === today);
  const activeOrders = orders.filter(o => o.status !== 'Teslim Edildi');
  const formattedDate = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const totalBalance = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const deliveredToday = todaysOrders.filter(o => o.status === 'Teslim Edildi').length;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Bekliyor': return { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' };
      case 'Yolda': return { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' };
      case 'Teslim Edildi': return { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF' };
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EA580C" />}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerBadge}>
                <Zap color="#F97316" size={14} />
                <Text style={styles.headerBadgeText}>Aktif</Text>
              </View>
              <TouchableOpacity style={styles.profileBtn} onPress={signOut} activeOpacity={0.7}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <LogOut color="rgba(255,255,255,0.6)" size={16} />
              </TouchableOpacity>
            </View>
            <Text style={styles.greeting}>Hoş Geldiniz, {profile?.name?.split(' ')[0] || ''} 👋</Text>
            <Text style={styles.title}>İş Özeti</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.loadingText}>Bulut ile Eşitleniyor...</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <AnimatedCard delay={100} style={styles.statCardWrapper}>
                <View style={[styles.statCard, styles.statCardOrange]}>
                  <View style={styles.statIconContainer}>
                    <View style={[styles.statIconBg, { backgroundColor: 'rgba(234, 88, 12, 0.15)' }]}>
                      <Package color="#EA580C" size={22} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{todaysOrders.length}</Text>
                  <Text style={styles.statLabel}>Bugünkü Sipariş</Text>
                </View>
              </AnimatedCard>

              <AnimatedCard delay={200} style={styles.statCardWrapper}>
                <View style={[styles.statCard, styles.statCardGreen]}>
                  <View style={styles.statIconContainer}>
                    <View style={[styles.statIconBg, { backgroundColor: 'rgba(22, 163, 74, 0.15)' }]}>
                      <DollarSign color="#16A34A" size={22} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{totalBalance.toLocaleString('tr-TR')} ₺</Text>
                  <Text style={styles.statLabel}>Toplam Alacak</Text>
                </View>
              </AnimatedCard>
            </View>

            <View style={styles.statsGrid}>
              <AnimatedCard delay={300} style={styles.statCardWrapper}>
                <View style={[styles.statCard, styles.statCardBlue]}>
                  <View style={styles.statIconContainer}>
                    <View style={[styles.statIconBg, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
                      <TrendingUp color="#2563EB" size={22} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{activeOrders.length}</Text>
                  <Text style={styles.statLabel}>Aktif Sipariş</Text>
                </View>
              </AnimatedCard>

              <AnimatedCard delay={400} style={styles.statCardWrapper}>
                <View style={[styles.statCard, styles.statCardPurple]}>
                  <View style={styles.statIconContainer}>
                    <View style={[styles.statIconBg, { backgroundColor: 'rgba(147, 51, 234, 0.15)' }]}>
                      <Clock color="#9333EA" size={22} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{deliveredToday}</Text>
                  <Text style={styles.statLabel}>Bugün Teslim</Text>
                </View>
              </AnimatedCard>
            </View>

            {/* Active Orders Section */}
            <AnimatedCard delay={500}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Aktif Siparişler</Text>
                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => navigation.navigate('Siparişler')}
                >
                  <Text style={styles.seeAllText}>Tümü</Text>
                  <ChevronRight color="#EA580C" size={16} />
                </TouchableOpacity>
              </View>

              {activeOrders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Package color="#D1D5DB" size={40} />
                  <Text style={styles.emptyTitle}>Bekleyen sipariş yok</Text>
                  <Text style={styles.emptySubtext}>Yeni sipariş eklemek için Siparişler sekmesine gidin</Text>
                </View>
              ) : (
                activeOrders.slice(0, 5).map((order, index) => {
                  const status = getStatusStyle(order.status);
                  return (
                    <AnimatedCard key={order.id} delay={550 + index * 80}>
                      <View style={styles.orderCard}>
                        <View style={[styles.orderAccent, { backgroundColor: status.dot }]} />
                        <View style={styles.orderContent}>
                          <View style={styles.orderTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.orderCustomer}>{order.customerName}</Text>
                              <Text style={styles.orderRoute}>
                                {order.pickupLocation || '-'} → {order.deliveryLocation || '-'}
                              </Text>
                            </View>
                            <View style={styles.orderRight}>
                              <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                                <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
                                <Text style={[styles.statusText, { color: status.text }]}>{order.status}</Text>
                              </View>
                              <Text style={styles.orderAmount}>{order.amount} ₺</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </AnimatedCard>
                  );
                })
              )}
            </AnimatedCard>

            {/* Quick Action */}
            <AnimatedCard delay={800}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Siparişler')}
                activeOpacity={0.85}
              >
                <Package color="#FFFFFF" size={20} />
                <Text style={styles.actionButtonText}>Yeni Sipariş Oluştur</Text>
                <ChevronRight color="rgba(255,255,255,0.7)" size={18} />
              </TouchableOpacity>
            </AnimatedCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  container: {
    paddingBottom: 30,
  },

  // Header
  headerSection: {
    marginBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  headerGradient: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingTop: 0, // Controlled by insets in JSX
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  headerBadgeText: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
  },

  // Loading
  loadingContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  loadingText: {
    marginTop: 14,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCardWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  statCardOrange: { borderBottomWidth: 3, borderBottomColor: '#F97316' },
  statCardGreen: { borderBottomWidth: 3, borderBottomColor: '#22C55E' },
  statCardBlue: { borderBottomWidth: 3, borderBottomColor: '#3B82F6' },
  statCardPurple: { borderBottomWidth: 3, borderBottomColor: '#A855F7' },
  statIconContainer: {
    marginBottom: 12,
  },
  statIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#EA580C',
    fontWeight: '600',
    marginRight: 2,
  },

  // Empty
  emptyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },

  // Order Card
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  orderAccent: {
    width: 4,
  },
  orderContent: {
    flex: 1,
    padding: 16,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  orderCustomer: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  orderRoute: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  orderRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    marginRight: 4,
  },
});
