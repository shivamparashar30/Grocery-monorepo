import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

// Tab screens
import AdminDashboard from '../screens/admin/AdminHomescreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminDriversScreen from '../screens/admin/AdminDriversScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

// Stack sub-screens
import AdminSectionsScreen from '../screens/admin/AdminSectionsScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import RegisterDriverScreen from '../screens/admin/RegisterDriverScreen';
import AdminNotificationsScreen from '../screens/admin/AdminNotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  DashboardTab: { active: 'grid', inactive: 'grid-outline' },
  OrdersTab: { active: 'receipt', inactive: 'receipt-outline' },
  ProductsTab: { active: 'cube', inactive: 'cube-outline' },
  RidersTab: { active: 'bicycle', inactive: 'bicycle-outline' },
  ProfileTab: { active: 'person-circle', inactive: 'person-circle-outline' },
};

const TabBarIcon = ({ route, focused, color, size }) => {
  const icons = TAB_ICONS[route.name];
  const iconName = focused ? icons.active : icons.inactive;
  return <Icon name={iconName} size={22} color={color} />;
};

const AdminTabs = () => {
  const insets = useSafeAreaInsets();
  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: (props) => <TabBarIcon route={route} {...props} />,
      tabBarActiveTintColor: '#6C5CE7',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: {
        ...styles.tabBar,
        paddingBottom: Math.max(insets.bottom, 8),
        height: 56 + Math.max(insets.bottom, 8),
      },
      tabBarLabelStyle: styles.tabLabel,
      tabBarItemStyle: styles.tabItem,
    })}
  >
    <Tab.Screen
      name="DashboardTab"
      component={AdminDashboard}
      options={{ tabBarLabel: 'Dashboard' }}
    />
    <Tab.Screen
      name="OrdersTab"
      component={AdminOrdersScreen}
      options={{ tabBarLabel: 'Orders' }}
    />
    <Tab.Screen
      name="ProductsTab"
      component={AdminProductsScreen}
      options={{ tabBarLabel: 'Products' }}
    />
    <Tab.Screen
      name="RidersTab"
      component={AdminDriversScreen}
      options={{ tabBarLabel: 'Riders' }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={AdminProfileScreen}
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
  );
};

const AdminNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="AdminTabs" component={AdminTabs} />
    <Stack.Screen name="AdminSections" component={AdminSectionsScreen} />
    <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
    <Stack.Screen
      name="RegisterDriver"
      component={RegisterDriverScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
});

export default AdminNavigator;
