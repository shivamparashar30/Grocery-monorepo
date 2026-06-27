import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator, View, Text } from 'react-native';
import store from './src/store/store';
import { loadStoredAuth } from './src/store/slices/authSlice';
import { loadStoredUser } from './src/store/slices/userSlice';
import RootNavigator from './src/navigation/RootNavigator';
import notificationService from './src/services/notificationService';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';

// App Content with Redux hooks
const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    // Initialize app - load stored auth data and setup notifications
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Load stored authentication data from AsyncStorage
        await dispatch(loadStoredAuth());
        await dispatch(loadStoredUser());

        console.log('Auth data loaded from storage');

        // Initialize notifications
        const hasPermission = await notificationService.requestPermission();
        
        if (hasPermission) {
          console.log('Notification permission granted');
          const token = await notificationService.getToken();
          
          if (token) {
            console.log('FCM Token obtained:', token);
            // Token is available for backend sync if needed
          }
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, [dispatch]);

  // Show loading screen while checking authentication state
  if (!isInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#fff' 
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#4CAF50',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
          shadowColor: '#4CAF50',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}>
          <Text style={{ fontSize: 40 }}>🛒</Text>
        </View>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: '#7f8c8d',
          fontWeight: '600' 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Render main app navigation
  return <RootNavigator />;
};

// Main App Component with Redux Provider
const App = () => {
  return (
    <WishlistProvider>
    <CartProvider>
    <Provider store={store}>
      <AppContent />
    </Provider>
    </CartProvider>
    </WishlistProvider>
  );
};

export default App;