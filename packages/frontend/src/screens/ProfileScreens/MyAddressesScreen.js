import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import tw from '../../utils/tailwind';

const MyAddressesScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([
    {
      id: '1',
      type: 'HOME',
      name: 'Neha',
      address: 'A-204, Green Valley Apartments, Sector 12',
      city: 'Pushkar, Rajasthan',
      pincode: '305022',
      phone: '+91 98765 43210',
      isDefault: true,
    },
    {
      id: '2',
      type: 'WORK',
      name: 'Neha',
      address: 'Tech Park, Building B, Floor 3',
      city: 'Ajmer, Rajasthan',
      pincode: '305001',
      phone: '+91 98765 43210',
      isDefault: false,
    },
    {
      id: '3',
      type: 'OTHER',
      name: 'Home',
      address: 'Plot 45, Brahma Colony',
      city: 'Pushkar, Rajasthan',
      pincode: '305022',
      phone: '+91 98765 43210',
      isDefault: false,
    },
  ]);

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAddresses(addresses.filter(addr => addr.id !== id));
          },
        },
      ]
    );
  };

  const handleSetDefault = (id) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    })));
  };

  const getAddressTypeColor = (type) => {
    switch (type) {
      case 'HOME':
        return 'bg-blue-100 text-blue-700';
      case 'WORK':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case 'HOME':
        return 'home';
      case 'WORK':
        return 'briefcase';
      default:
        return 'location';
    }
  };

  const renderAddress = (address) => {
    const colorClass = getAddressTypeColor(address.type);
    
    return (
      <View
        key={address.id}
        style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm border ${address.isDefault ? 'border-green-500' : 'border-gray-200'}`}
      >
        {/* Header */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`w-10 h-10 ${colorClass.split(' ')[0]} rounded-full justify-center items-center mr-3`}>
              <Icon 
                name={getAddressIcon(address.type)} 
                size={20} 
                color={colorClass.includes('blue') ? '#1D4ED8' : colorClass.includes('purple') ? '#7C3AED' : '#374151'} 
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-bold text-[#1A1A1A]`}>
                {address.type}
              </Text>
              {address.isDefault && (
                <View style={tw`bg-green-100 self-start px-2 py-0.5 rounded-full mt-1`}>
                  <Text style={tw`text-xs font-bold text-green-700`}>Default</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Address Details */}
        <View style={tw`mb-3`}>
          <Text style={tw`text-sm font-semibold text-[#1A1A1A] mb-1`}>
            {address.name}
          </Text>
          <Text style={tw`text-sm text-gray-600 mb-0.5`}>
            {address.address}
          </Text>
          <Text style={tw`text-sm text-gray-600 mb-0.5`}>
            {address.city} - {address.pincode}
          </Text>
          <Text style={tw`text-sm text-gray-600`}>
            Phone: {address.phone}
          </Text>
        </View>

        {/* Actions */}
        <View style={tw`flex-row gap-2`}>
          <TouchableOpacity
            style={tw`flex-1 bg-gray-100 rounded-lg py-2.5 items-center`}
            onPress={() => navigation.navigate('EditAddress', { address })}
          >
            <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>Edit</Text>
          </TouchableOpacity>
          
          {!address.isDefault && (
            <TouchableOpacity
              style={tw`flex-1 bg-green-50 rounded-lg py-2.5 items-center border border-green-500`}
              onPress={() => handleSetDefault(address.id)}
            >
              <Text style={tw`text-sm font-bold text-green-600`}>Set Default</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={tw`bg-red-50 rounded-lg px-4 py-2.5 items-center border border-red-500`}
            onPress={() => handleDelete(address.id)}
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
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={tw`bg-white shadow-sm`}>
        <View style={tw`flex-row items-center justify-between px-4 py-3`}>
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

      <ScrollView 
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`p-4 pb-6`}
      >
        {/* Add New Address Button */}
        <TouchableOpacity
          style={tw`bg-green-500 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-center`}
          onPress={() => navigation.navigate('MapSelection')}
          activeOpacity={0.7}
        >
          <Icon name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={tw`text-base font-bold text-white ml-2`}>
            Add New Address
          </Text>
        </TouchableOpacity>

        {/* Addresses List */}
        {addresses.length > 0 ? (
          addresses.map(renderAddress)
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

        {/* Info Box */}
        {addresses.length > 0 && (
          <View style={tw`bg-blue-50 rounded-xl p-4 mt-2`}>
            <View style={tw`flex-row items-start`}>
              <Icon name="information-circle" size={20} color="#3B82F6" />
              <Text style={tw`text-sm text-blue-700 ml-2 flex-1`}>
                You can save multiple addresses for faster checkout. Set one as default for quick delivery.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MyAddressesScreen;