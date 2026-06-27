

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';           // existing user navigator
import AdminNavigator from './AdminNavigator';       // new
import DriverNavigator from './DriverNavigator';     // new

const RootNavigator = () => {
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  // Role lives in userSlice (set via setUserData after login)
  const role = useSelector((state) => state.user?.data?.role);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // Pick the right navigator based on role
  const getAppNavigator = () => {
    switch (role) {
      case 'admin':  return <AdminNavigator />;
      case 'driver': return <DriverNavigator />;
      default:       return <AppNavigator />;   // 'user' or fallback
    }
  };

  return (
    <NavigationContainer>
      {isAuthenticated ? getAppNavigator() : <AuthNavigator />}
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