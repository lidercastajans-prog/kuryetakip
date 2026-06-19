import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Animated, RefreshControl, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { customerBalance } from '../lib/balance';
import RefreshButton from '../components/RefreshButton';
import PushToggle from '../components/PushToggle';
import { Package, DollarSign, Clock, ChevronRight, TrendingUp, Zap, LogOut } from 'lucide-react-native';
import { useTabNavigation } from '../navigation/tabNav';
import { statusStyle, HIG, HIG_TYPE } from '../theme';

const AnimatedCard = ({ children, delay = 0, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const { orders, customers, cashTransactions, fetchData, isLoading } = useStore();
  const { profile, signOut } = useAuthStore();
  const { navigate } = useTabNavigation();
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
  const totalBalance = customers.reduce((sum, c) => sum + customerBalance(c.id, orders, cashTransactions), 0);
  const deliveredToday = todaysOrders.filter(o => o.status === 'Teslim Edildi').length;

  const stats = [
    { icon: Package, tint: HIG.tint, value: todaysOrders.length, label: 'Bugünkü Sipariş' },
    { icon: DollarSign, tint: HIG.green, value: `${totalBalance.toLocaleString('tr-TR')} ₺`, label: 'Toplam Alacak' },
    { icon: TrendingUp, tint: HIG.blue, value: activeOrders.length, label: 'Aktif Sipariş' },
    { icon: Clock, tint: HIG.indigo, value: deliveredToday, label: 'Bugün Teslim' },
  ];

  const firstName = profile?.name ? profile.name.split(' ')[0] : '';

  return (
    <View style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={HIG.tint} />}
      >
        {/* Large-title header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.statusPill}>
              <Zap color={HIG.tint} size={13} />
              <Text style={styles.statusPillText}>Aktif</Text>
            </View>
            <View style={styles.headerActions}>
              <RefreshButton color={HIG.tint} style={styles.iconBtn} onPress={onRefresh} />
              <TouchableOpacity
                style={styles.profileBtn}
                onPress={signOut}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Çıkış yap"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <LogOut color={HIG.tertiaryLabel} size={16} />
              </TouchableOpacity>
            </View>
          </View>
          {!!firstName && <Text style={styles.greeting}>Hoş Geldiniz, {firstName}</Text>}
          <Text style={styles.largeTitle}>İş Özeti</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        <PushToggle />

        {isLoading && !refreshing ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={HIG.tint} />
            <Text style={styles.loadingText}>Bulut ile Eşitleniyor…</Text>
          </View>
        ) : (
          <>
            {/* Stats — inset cards on grouped background */}
            <View style={styles.statsGrid}>
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <AnimatedCard key={s.label} delay={80 + i * 70} style={styles.statCardWrapper}>
                    <View style={styles.statCard}>
                      <View style={[styles.statIconBg, { backgroundColor: s.tint + '22' }]}>
                        <Icon color={s.tint} size={20} />
                      </View>
                      <Text style={styles.statValue}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  </AnimatedCard>
                );
              })}
            </View>

            {/* Active orders — grouped inset list */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AKTİF SİPARİŞLER</Text>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigate('Siparişler')}
                accessibilityRole="button"
                accessibilityLabel="Tüm siparişleri gör"
              >
                <Text style={styles.seeAllText}>Tümü</Text>
                <ChevronRight color={HIG.tint} size={16} />
              </TouchableOpacity>
            </View>

            {activeOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Package color={HIG.tertiaryLabel} size={36} />
                <Text style={styles.emptyTitle}>Bekleyen sipariş yok</Text>
                <Text style={styles.emptySubtext}>Yeni sipariş eklemek için Siparişler sekmesine gidin</Text>
              </View>
            ) : (
              <AnimatedCard delay={360} style={styles.listCard}>
                {activeOrders.slice(0, 5).map((order, index, arr) => {
                  const status = statusStyle(order.status);
                  return (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.row}
                      activeOpacity={0.6}
                      onPress={() => navigate('Siparişler')}
                      accessibilityRole="button"
                      accessibilityLabel={`${order.customerName}, ${order.status}, ${order.amount} lira`}
                    >
                      <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
                      <View style={styles.rowContent}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{order.customerName}</Text>
                        <Text style={styles.rowSubtitle} numberOfLines={1}>
                          {order.pickupLocation || '-'} → {order.deliveryLocation || '-'}
                        </Text>
                      </View>
                      <View style={styles.rowRight}>
                        <Text style={styles.rowAmount}>{order.amount} ₺</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: status.text }]}>{order.status}</Text>
                        </View>
                      </View>
                      <ChevronRight color={HIG.tertiaryLabel} size={18} />
                      {index < arr.length - 1 && <View style={styles.separator} />}
                    </TouchableOpacity>
                  );
                })}
              </AnimatedCard>
            )}

            {/* Quick action */}
            <AnimatedCard delay={500}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigate('Siparişler')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Yeni sipariş oluştur"
              >
                <Package color="#FFFFFF" size={20} />
                <Text style={styles.actionButtonText}>Yeni Sipariş Oluştur</Text>
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
    backgroundColor: HIG.groupedBg,
  },
  container: {
    paddingBottom: 140,
  },

  // Large-title header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: HIG.tint + '1A',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 100,
  },
  statusPillText: {
    color: HIG.tint,
    fontSize: 13,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: HIG.cardBg,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: HIG.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  greeting: {
    ...HIG_TYPE.subhead,
    color: HIG.secondaryLabel,
    marginBottom: 2,
  },
  largeTitle: {
    ...HIG_TYPE.largeTitle,
    color: HIG.label,
  },
  dateText: {
    ...HIG_TYPE.footnote,
    color: HIG.secondaryLabel,
    marginTop: 4,
  },

  // Loading
  loadingCard: {
    backgroundColor: HIG.cardBg,
    borderRadius: HIG.radiusCard,
    padding: 36,
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: HIG.secondaryLabel,
    ...HIG_TYPE.subhead,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 12,
  },
  statCardWrapper: {
    width: '50%',
    padding: 4,
  },
  statCard: {
    backgroundColor: HIG.cardBg,
    borderRadius: HIG.radiusCard,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    }),
  },
  statIconBg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    ...HIG_TYPE.title2,
    color: HIG.label,
    letterSpacing: -0.3,
  },
  statLabel: {
    ...HIG_TYPE.footnote,
    color: HIG.secondaryLabel,
    marginTop: 3,
  },

  // Section header (iOS grouped style)
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginTop: 26,
    marginBottom: 8,
  },
  sectionTitle: {
    ...HIG_TYPE.footnote,
    fontWeight: '600',
    color: HIG.secondaryLabel,
    letterSpacing: 0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...HIG_TYPE.subhead,
    color: HIG.tint,
    fontWeight: '500',
  },

  // Grouped inset list
  listCard: {
    backgroundColor: HIG.cardBg,
    borderRadius: HIG.radiusCard,
    marginHorizontal: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    ...HIG_TYPE.body,
    fontWeight: '600',
    color: HIG.label,
  },
  rowSubtitle: {
    ...HIG_TYPE.footnote,
    color: HIG.secondaryLabel,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    marginRight: 6,
  },
  rowAmount: {
    ...HIG_TYPE.body,
    fontWeight: '600',
    color: HIG.label,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    marginTop: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    position: 'absolute',
    left: 38,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: HIG.separator,
  },

  // Empty
  emptyCard: {
    backgroundColor: HIG.cardBg,
    marginHorizontal: 16,
    borderRadius: HIG.radiusCard,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    ...HIG_TYPE.headline,
    color: HIG.label,
    marginTop: 12,
  },
  emptySubtext: {
    ...HIG_TYPE.footnote,
    color: HIG.secondaryLabel,
    marginTop: 4,
    textAlign: 'center',
  },

  // Action button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: HIG.tint,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: HIG.radiusButton,
  },
  actionButtonText: {
    color: '#FFFFFF',
    ...HIG_TYPE.headline,
  },
});
