import AdminHomescreen       from '../screens/admin/AdminHomescreen';
import AdminDriversScreen    from '../screens/admin/AdminDriversScreen';
import AdminOrdersScreen     from '../screens/admin/AdminOrdersScreen';
import AdminUsersScreen      from '../screens/admin/AdminUsersScreen';
import AdminProductsScreen   from '../screens/admin/AdminProductsScreen';
import AdminAnalyticsScreen  from '../screens/admin/AdminAnalyticsScreen';
import RegisterDriverScreen  from '../screens/admin/RegisterDriverScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
 
const Stack = createNativeStackNavigator();
 
const AdminNavigator = () => (
  <Stack.Navigator
    initialRouteName="AdminHome"
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="AdminHome"       component={AdminHomescreen}      />
    <Stack.Screen name="AdminDrivers"    component={AdminDriversScreen}   />
    <Stack.Screen name="AdminOrders"     component={AdminOrdersScreen}    />
    <Stack.Screen name="AdminUsers"      component={AdminUsersScreen}     />
    <Stack.Screen name="AdminProducts"   component={AdminProductsScreen}  />
    <Stack.Screen name="AdminAnalytics"  component={AdminAnalyticsScreen} />
    <Stack.Screen
      name="RegisterDriver"
      component={RegisterDriverScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
  </Stack.Navigator>
);
 
export default AdminNavigator;
 