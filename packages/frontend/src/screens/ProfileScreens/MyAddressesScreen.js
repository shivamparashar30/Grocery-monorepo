import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/apiconfig';
import { useAddress } from '../../context/AddressContext';
import tw from '../../utils/tailwind';

const TAG_ICONS = { home: 'home', work: 'briefcase', other: 'location' };
const TAG_COLORS = {
  home: { bg: 'bg-blue-100', icon: '#1D4ED8' },
  work: { bg: 'bg-purple-100', icon: '#7C3AED' },
  other: { bg: 'bg-gray-100', icon: '#374151' },
};

const MyAddressesScreen = ({ navigation }) => {
  const { savedAddresses, fetchSavedAddresses, selectAddress } = useAddress();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        await fetchSavedAddresses();
        setLoading(false);
      })();
    }, [fetchSavedAddresses])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavedAddresses();
    setRefreshing(false);
  };

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BASE_URL}/addresses/${id}`, {
              method: 'DELETE', headers,
            });
            const data = await res.json();
            if (data.success) {
              fetchSavedAddresses();
            } else {
              Alert.alert('Error', data.message || 'Failed to delete');
            }
          } catch {
            Alert.alert('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/addresses/${id}/default`, {
        method: 'PUT', headers,
      });
      const data = await res.json();
      if (data.success) {
        selectAddress(data.data);
        fetchSavedAddresses();
      } else {
        Alert.alert('Error', data.message || 'Failed to set default');
      }
    } catch {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const handleEdit = (address) => {
    navigation.navigate('MapSelection', { editAddress: address });
  };

  const getTypeInfo = (type) => TAG_COLORS[type] || TAG_COLORS.other;

  const renderAddress = (address) => {
    const info = getTypeInfo(address.addressType);
    const icon = TAG_ICONS[address.addressType] || 'location';
    const label =
      address.customTag ||
      (address.addressType === 'work'
        ? 'Office'
        : (address.addressType || 'home').charAt(0).toUpperCase() +
          (address.addressType || 'home').slice(1));

    return (
      <View
        key={address._id}
        style={tw`bg-white rounded-2xl p-4 mb-3 border ${
          address.isDefault ? 'border-green-500' : 'border-gray-200'
        }`}
      >
        {/* Header */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View
              style={tw`w-10 h-10 ${info.bg} rounded-full justify-center items-center mr-3`}
            >
              <Icon name={icon} size={20} color={info.icon} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-bold text-[#1A1A1A]`}>{label}</Text>
              {address.isDefault && (
                <View style={tw`bg-green-100 self-start px-2 py-0.5 rounded-full mt-1`}>
                  <Text style={tw`text-xs font-bold text-green-700`}>Default</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Address details */}
        <View style={tw`mb-3`}>
          <Text style={tw`text-sm font-semibold text-[#1A1A1A] mb-1`}>
            {address.fullName}
          </Text>
          <Text style={tw`text-sm text-gray-600 mb-0.5`}>
            {address.addressLine1}
          </Text>
          {address.addressLine2 ? (
            <Text style={tw`text-sm text-gray-600 mb-0.5`}>
              {address.addressLine2}
            </Text>
          ) : null}
          {address.landmark ? (
            <Text style={tw`text-sm text-gray-600 mb-0.5`}>
              Near: {address.landmark}
            </Text>
          ) : null}
          <Text style={tw`text-sm text-gray-600 mb-0.5`}>
            {address.city}, {address.state} - {address.pincode}
          </Text>
          <Text style={tw`text-sm text-gray-500`}>Phone: {address.phone}</Text>
        </View>

        {/* Actions */}
        <View style={tw`flex-row gap-2`}>
          <TouchableOpacity
            style={tw`flex-1 bg-gray-100 rounded-lg py-2.5 items-center`}
            onPress={() => handleEdit(address)}
          >
            <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>Edit</Text>
          </TouchableOpacity>

          {!address.isDefault && (
            <TouchableOpacity
              style={tw`flex-1 bg-green-50 rounded-lg py-2.5 items-center border border-green-500`}
              onPress={() => handleSetDefault(address._id)}
            >
              <Text style={tw`text-sm font-bold text-green-600`}>Set Default</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={tw`bg-red-50 rounded-lg px-4 py-2.5 items-center border border-red-500`}
            onPress={() => handleDelete(address._id)}
          >
            <Icon name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={tw`bg-white`}>
        <View style={tw`flex-row items-center px-4 py-3`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`flex-row items-center flex-1`}
          >
            <Icon name="chevron-back" size={24} color="#1A1A1A" />
            <Text style={tw`text-lg font-semibold text-[#1A1A1A] ml-2`}>
              My Addresses
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading && savedAddresses.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#2BB77D" />
        </View>
      ) : (
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`p-4 pb-6`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2BB77D"
            />
          }
        >
          {/* Add new address button */}
          <TouchableOpacity
            style={tw`bg-[#2BB77D] rounded-2xl p-4 mb-4 flex-row items-center justify-center`}
            onPress={() => navigation.navigate('MapSelection')}
            activeOpacity={0.7}
          >
            <Icon name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={tw`text-base font-bold text-white ml-2`}>
              Add New Address
            </Text>
          </TouchableOpacity>

          {/* Addresses list */}
          {savedAddresses.length > 0 ? (
            savedAddresses.map(renderAddress)
          ) : (
            <View style={tw`items-center justify-center py-20`}>
              <Icon name="location-outline" size={80} color="#D1D5DB" />
              <Text style={tw`text-lg font-semibold text-gray-400 mt-4`}>
                No addresses saved
              </Text>
              <Text style={tw`text-sm text-gray-400 mt-2`}>
                Add your first address to get started
              </Text>
            </View>
          )}

          {/* Info box */}
          {savedAddresses.length > 0 && (
            <View style={tw`bg-blue-50 rounded-xl p-4 mt-2`}>
              <View style={tw`flex-row items-start`}>
                <Icon name="information-circle" size={20} color="#3B82F6" />
                <Text style={tw`text-sm text-blue-700 ml-2 flex-1`}>
                  Save multiple addresses for faster checkout. Set one as default for quick delivery.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default MyAddressesScreen;
