import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
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

function MainTabs() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  // Detect if running on mobile browser
  const isMobileWeb = isWeb && (
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  // iOS reports a FLUCTUATING bottom inset while scrolling (the Safari toolbar
  // shows/hides and the home-indicator zone changes), which made the tab bar
  // grow mid-scroll. Freeze the first real (non-zero) inset and use that fixed
  // value from then on, so the bar's size never changes after the first render.
  const [frozenBottom, setFrozenBottom] = useState(null);
  useEffect(() => {
    if (frozenBottom === null && insets.bottom > 0) setFrozenBottom(insets.bottom);
  }, [insets.bottom, frozenBottom]);

  // #root no longer adds the safe-area padding (App.js), so the tab bar is the
  // single source of bottom spacing — no double-counting.
  const rawBottom = frozenBottom ?? insets.bottom;
  const bottomInset = rawBottom > 0 ? rawBottom : (isMobileWeb ? 16 : 8);

  // Explicit height = content area (icon + label) + bottom safe spacing.
  // Without this the bar relies on minHeight and clips the labels.
  const tabBarHeight = 56 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: HIG.tint,
        tabBarInactiveTintColor: HIG.tertiaryLabel,
        tabBarLabelStyle: {
          fontSize: 11,
          // lineHeight must exceed fontSize so descenders (p, ş, g) aren't clipped.
          lineHeight: 14,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: HIG.cardBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: HIG.separator,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: bottomInset,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
            android: {
              elevation: 8,
            },
            web: {
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.06)',
            }
          }),
        },
        tabBarIcon: ({ color, focused }) => {
          let IconComponent;
          if (route.name === 'Özet') IconComponent = Home;
          else if (route.name === 'Siparişler') IconComponent = Package;
          else if (route.name === 'Cari') IconComponent = Users;
          else if (route.name === 'Premium') IconComponent = Crown;

          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <IconComponent color={color} size={22} />
              {focused && <View style={styles.activeDot} />}
            </View>
          );
        },
      })}
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
        <ActivityIndicator size="large" color="#EA580C" />
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {},
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: HIG.tint,
    marginTop: 3,
  },
});
