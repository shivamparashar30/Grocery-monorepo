import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DriverHomescreen from '../screens/driver/DriverHomescreen';
import DriverDeliveryDetailScreen from '../screens/driver/DriverDeliveryDetailScreen';
import AvailableOrdersScreen from '../screens/driver/AvailableOrdersScreen';

const Stack = createNativeStackNavigator();

const DriverNavigator = () => (
  <Stack.Navigator
    initialRouteName="DriverHome"
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="DriverHome" component={DriverHomescreen} />
    <Stack.Screen name="DriverDeliveryDetail" component={DriverDeliveryDetailScreen} />
    <Stack.Screen name="AvailableOrders" component={AvailableOrdersScreen} />
  </Stack.Navigator>
);

export default DriverNavigator;
