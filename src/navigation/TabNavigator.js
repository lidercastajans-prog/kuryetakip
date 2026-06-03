import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Package, Users, Crown } from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import CustomersScreen from '../screens/CustomersScreen';
import PremiumScreen from '../screens/PremiumScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAuthStore } from '../store/useAuthStore';

const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';

  // Detect if running on mobile browser
  const isMobileWeb = isWeb && (
    typeof navigator !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  // Dynamic bottom inset to prevent cutoff on notch devices and mobile browsers
  const bottomInset = insets.bottom > 0 ? insets.bottom : (isIOS ? 24 : 0);
  const tabBarHeight = isWeb ? 74 : (60 + bottomInset);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#EA580C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: isWeb ? 6 : 4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingTop: 12,
          paddingBottom: isWeb ? 12 : bottomInset,
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
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();

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
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <LoginScreen />}
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
    paddingTop: 4,
  },
  iconContainerActive: {},
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EA580C',
    marginTop: 3,
  },
});
