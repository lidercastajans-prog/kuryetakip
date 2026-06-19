import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Package, Users, Crown } from 'lucide-react-native';
import { HIG } from '../theme';
import { TabNavContext } from './tabNav';

import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import CustomersScreen from '../screens/CustomersScreen';
import PremiumScreen from '../screens/PremiumScreen';
import LoginScreen from '../screens/LoginScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';
import { useAuthStore } from '../store/useAuthStore';

const TABS = [
  { key: 'Özet', icon: Home, component: DashboardScreen },
  { key: 'Siparişler', icon: Package, component: OrdersScreen },
  { key: 'Cari', icon: Users, component: CustomersScreen },
  { key: 'Premium', icon: Crown, component: PremiumScreen },
];

function CustomTabBar({ activeTab, onChange }) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  return (
    <View
      nativeID={isWeb ? 'kt-tabbar' : undefined}
      style={[styles.tabBar, !isWeb && { paddingBottom: (insets.bottom || 8) + 2 }]}
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const focused = t.key === activeTab;
        const color = focused ? HIG.tint : HIG.tertiaryLabel;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tabItem}
            onPress={() => onChange(t.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t.key}
          >
            <View style={styles.iconWrap}>
              <Icon color={color} size={22} />
              {focused && <View style={styles.activeDot} />}
            </View>
            <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>{t.key}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Custom tab navigation — no react-navigation tab navigator. The whole UI is a
// non-scrolling flex column inside the locked body (App.js): the screen area is
// a bounded flex:1 region whose content scrolls INTERNALLY, and the tab bar is a
// fixed-height sibling below it. Because the body never scrolls and the bar is in
// normal flow, the bar cannot move and touches map 1:1 (the iOS standalone PWA
// bottom-bar dr/offset issues came from a scrolling document + a fixed bar).
function MainTabs() {
  const [activeTab, setActiveTab] = useState('Özet');
  const nav = useMemo(() => ({ activeTab, navigate: setActiveTab }), [activeTab]);

  return (
    <TabNavContext.Provider value={nav}>
      <View style={styles.shell}>
        <View style={styles.screenArea}>
          {TABS.map((t) => {
            const Screen = t.component;
            const isActive = t.key === activeTab;
            // Keep every screen mounted (preserve scroll position / state); only
            // the active one is visible and interactive.
            return (
              <View
                key={t.key}
                style={[styles.screenLayer, !isActive && styles.hidden]}
                pointerEvents={isActive ? 'auto' : 'none'}
              >
                <Screen />
              </View>
            );
          })}
        </View>
        <CustomTabBar activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </TabNavContext.Provider>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, recoveryMode, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={HIG.tint} />
      </View>
    );
  }

  return recoveryMode ? <NewPasswordScreen /> : isAuthenticated ? <MainTabs /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  shell: { flex: 1, backgroundColor: HIG.groupedBg },
  screenArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  screenLayer: { ...StyleSheet.absoluteFillObject },
  hidden: { display: 'none' },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HIG.cardBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HIG.separator,
    paddingTop: 4,
    minHeight: 44,
    ...Platform.select({
      // Web bottom padding (home-indicator clearance) is set by CSS env() in App.js (#kt-tabbar).
      web: { paddingBottom: 4, boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', height: 24 },
  tabLabel: { fontSize: 11, lineHeight: 13, fontWeight: '600', marginTop: 3 },
  activeDot: { position: 'absolute', bottom: -6, width: 4, height: 4, borderRadius: 2, backgroundColor: HIG.tint },
});
