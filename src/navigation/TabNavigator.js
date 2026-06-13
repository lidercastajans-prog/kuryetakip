import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Package, Users, Crown } from 'lucide-react-native';
import { HIG } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import CustomersScreen from '../screens/CustomersScreen';
import PremiumScreen from '../screens/PremiumScreen';
import LoginScreen from '../screens/LoginScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';
import { useAuthStore } from '../store/useAuthStore';

const Tab = createBottomTabNavigator();

const TAB_ICONS = { 'Özet': Home, 'Siparişler': Package, 'Cari': Users, 'Premium': Crown };

// Fully custom tab bar — deliberately NOT react-navigation's dynamic bar.
// On web it is position:fixed to the viewport bottom and the bottom safe-area is
// handled by pure CSS (#kt-tabbar { padding-bottom: calc(8px + env(...)) } in
// App.js). It reads NO JavaScript safe-area inset on web, so the iOS Safari
// toolbar / home-indicator fluctuations can never resize it. On native it falls
// back to the (stable) native inset.
function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <View
      nativeID={isWeb ? 'kt-tabbar' : undefined}
      style={[
        styles.tabBar,
        isWeb
          ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50 }
          : { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: (insets.bottom || 8) + 6 },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = TAB_ICONS[route.name];
        const color = focused ? HIG.tint : HIG.tertiaryLabel;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={route.name}
          >
            <View style={styles.iconWrap}>
              {Icon && <Icon color={color} size={22} />}
              {focused && <View style={styles.activeDot} />}
            </View>
            <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Özet" component={DashboardScreen} />
      <Tab.Screen name="Siparişler" component={OrdersScreen} />
      <Tab.Screen name="Cari" component={CustomersScreen} />
      <Tab.Screen name="Premium" component={PremiumScreen} />
    </Tab.Navigator>
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

  return (
    <NavigationContainer
      documentTitle={{ formatter: () => 'KuryeTakip' }}
    >
      {recoveryMode ? <NewPasswordScreen /> : isAuthenticated ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: HIG.cardBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HIG.separator,
    paddingTop: 8,
    ...Platform.select({
      // On web the bottom padding is set by CSS env() (#kt-tabbar in App.js).
      web: { paddingBottom: 8, boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  activeDot: {
    position: 'absolute',
    bottom: -5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: HIG.tint,
  },
});
