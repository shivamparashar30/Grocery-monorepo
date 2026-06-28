
import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import AdminNavigator from './AdminNavigator';
import DriverNavigator from './DriverNavigator';
import { navigationRef } from './navigationRef';
import FloatingCart from '../components/FloatingCart';

const RootNavigator = () => {
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  const role = useSelector((state) => state.user?.data?.role);
  const [currentRoute, setCurrentRoute] = useState('');

  const onStateChange = useCallback(() => {
    const route = navigationRef.current?.getCurrentRoute();
    setCurrentRoute(route?.name ?? '');
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const isUser = isAuthenticated && (!role || role === 'user');

  const getAppNavigator = () => {
    switch (role) {
      case 'admin':  return <AdminNavigator />;
      case 'driver': return <DriverNavigator />;
      default:       return <AppNavigator />;
    }
  };

  return (
    <NavigationContainer ref={navigationRef} onStateChange={onStateChange}>
      {isAuthenticated ? getAppNavigator() : <AuthNavigator />}
      {isUser && <FloatingCart currentRoute={currentRoute} />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default RootNavigator;