import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import OrderAgainScreen from '../screens/OrderAgainScreen';
import CategoriesScreen from '../screens/category/CategoriesScreen';
import CategoryProductsScreen from '../screens/category/CategoryProductsScreen';
import ProductDetailScreen from '../screens/category/ProductDetailScreen'
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PrintScreen from '../screens/PrintScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/ProfileScreens/EditProfileScreen';
import PaymentMethodsScreen from '../screens/ProfileScreens/PaymentMethodsScreen';
import MyAddressesScreen from '../screens/ProfileScreens/MyAddressesScreen';
import AddPaymentMethodScreen from '../screens/ProfileScreens/AddPaymentMethodScreen';
import OrderHistoryScreen from '../screens/ProfileScreens/OrderHistoryScreen';
import MapSelectionScreen from '../screens/Homescreen/Mapselectionscreen';
import WishlistScreen from '../screens/WishlistScreen';
import BottomTabNavigator from '../navigation/BottomTabNavigator';

const Stack = createNativeStackNavigator();

const SCREENS = {
  Home:       HomeScreen,
  OrderAgain: OrderAgainScreen,
  Categories: CategoriesScreen,
  Print:      PrintScreen,
};

const TabContainer = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const ActiveScreen = SCREENS[activeTab];

  return (
    <View style={styles.container}>
      {/* ✅ This wrapper ensures screen fills all space above tab bar */}
      <View style={styles.screenWrapper}>
       <ActiveScreen navigation={navigation} onTabSwitch={setActiveTab} />
      </View>

      <BottomTabNavigator
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />
    </View>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
        initialRouteName="MainApp"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="MainApp"
          component={TabContainer}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
        />

        <Stack.Screen
          name="MyAddresses"
          component={MyAddressesScreen}
        />

        <Stack.Screen
          name="PaymentMethods"
          component={PaymentMethodsScreen}
        />

        <Stack.Screen
          name="OrderHistory"
          component={OrderHistoryScreen}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
        />

        <Stack.Screen
          name="Wishlist"
          component={WishlistScreen}
        />

        <Stack.Screen
          name="AddPaymentMethod"
          component={AddPaymentMethodScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        <Stack.Screen
          name="CategoryProductScreen"
          component={CategoryProductsScreen}
          options={{ animation: 'slide_from_bottom' }}
        />


        <Stack.Screen
          name="ProductDetailScreen"
          component={ProductDetailScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

         <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

         <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        <Stack.Screen
          name="MapSelection"
          component={MapSelectionScreen}
          options={{
            headerShown: true,
            headerTitle: 'Select Location',
            headerBackTitle: 'Back',
            presentation: 'modal',
            headerStyle: { backgroundColor: '#F5F5F5' },
            headerTitleStyle: { fontSize: 18, fontWeight: '600' },
            headerTintColor: '#1A1A1A',
          }}
        />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default AppNavigator;