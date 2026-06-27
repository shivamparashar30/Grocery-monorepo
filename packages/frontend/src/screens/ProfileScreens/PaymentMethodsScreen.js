import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import tw from '../../utils/tailwind';

const PaymentMethodsScreen = ({ navigation }) => {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      cardType: 'visa',
      cardNumber: '**** **** **** 4532',
      cardHolder: 'Neha',
      expiryDate: '12/26',
      isDefault: true,
      color: ['#1A1F71', '#2E3192'],
    },
    {
      id: '2',
      type: 'card',
      cardType: 'mastercard',
      cardNumber: '**** **** **** 8765',
      cardHolder: 'Neha',
      expiryDate: '09/25',
      isDefault: false,
      color: ['#EB001B', '#F79E1B'],
    },
    {
      id: '3',
      type: 'upi',
      upiId: 'shivam@paytm',
      name: 'Paytm UPI',
      isDefault: false,
      icon: 'qrcode-scan',
    },
    {
      id: '4',
      type: 'wallet',
      name: 'Paytm Wallet',
      balance: '₹1,250',
      isDefault: false,
      icon: 'wallet',
    },
    {
      id: '5',
      type: 'netbanking',
      bankName: 'HDFC Bank',
      accountNumber: '**** **** 4521',
      isDefault: false,
      icon: 'bank',
    },
  ]);

  const handleDelete = (id) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(paymentMethods.filter(method => method.id !== id));
          },
        },
      ]
    );
  };

  const handleSetDefault = (id) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id,
    })));
  };

 const getCardIcon = (cardType) => {
  switch (cardType) {
    case 'visa':
      return { uri: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' };
    case 'mastercard':
      return { uri: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' };
    case 'rupay':
      return { uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/RuPay.svg/512px-RuPay.svg.png' };
    default:
      return null;
  }
};

  const renderCard = (card) => {
    return (
      <View key={card.id} style={tw`mb-4`}>
        <LinearGradient
          colors={card.color}
          style={tw`rounded-2xl p-5 shadow-lg`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Card Header */}
          <View style={tw`flex-row justify-between items-start mb-6`}>
            <View>
              <Text style={tw`text-white text-xs font-semibold opacity-80 mb-1`}>
                Credit Card
              </Text>
              {card.isDefault && (
                <View style={tw`bg-white bg-opacity-20 px-2 py-1 rounded-full`}>
                  <Text style={tw`text-white text-xs font-bold`}>Default</Text>
                </View>
              )}
            </View>
            <View style={tw`bg-white rounded-lg px-3 py-2`}>
              <Text style={tw`text-sm font-bold ${card.cardType === 'visa' ? 'text-[#1A1F71]' : 'text-[#EB001B]'}`}>
                {card.cardType.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Card Number */}
          <Text style={tw`text-white text-xl font-bold tracking-wider mb-4`}>
            {card.cardNumber}
          </Text>

          {/* Card Footer */}
          <View style={tw`flex-row justify-between items-end`}>
            <View>
              <Text style={tw`text-white text-xs opacity-70 mb-1`}>Card Holder</Text>
              <Text style={tw`text-white text-sm font-semibold`}>{card.cardHolder}</Text>
            </View>
            <View>
              <Text style={tw`text-white text-xs opacity-70 mb-1 text-right`}>Expires</Text>
              <Text style={tw`text-white text-sm font-semibold`}>{card.expiryDate}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Card Actions */}
        <View style={tw`flex-row gap-2 mt-3 px-1`}>
          {!card.isDefault && (
            <TouchableOpacity
              style={tw`flex-1 bg-green-50 rounded-lg py-2.5 items-center border border-green-500`}
              onPress={() => handleSetDefault(card.id)}
            >
              <Text style={tw`text-sm font-bold text-green-600`}>Set as Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={tw`${card.isDefault ? 'flex-1' : 'flex-1'} bg-gray-100 rounded-lg py-2.5 items-center`}
            onPress={() => navigation.navigate('EditCard', { card })}
          >
            <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`bg-red-50 rounded-lg px-4 py-2.5 items-center border border-red-500`}
            onPress={() => handleDelete(card.id)}
          >
            <Icon name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUPI = (upi) => {
    return (
      <View
        key={upi.id}
        style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm border ${upi.isDefault ? 'border-green-500' : 'border-gray-200'}`}
      >
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`w-12 h-12 bg-purple-100 rounded-full justify-center items-center mr-3`}>
              <MaterialCommunityIcons name={upi.icon} size={24} color="#7C3AED" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-bold text-[#1A1A1A]`}>{upi.name}</Text>
              <Text style={tw`text-sm text-gray-600 mt-0.5`}>{upi.upiId}</Text>
              {upi.isDefault && (
                <View style={tw`bg-green-100 self-start px-2 py-0.5 rounded-full mt-1`}>
                  <Text style={tw`text-xs font-bold text-green-700`}>Default</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={tw`flex-row gap-2`}>
          {!upi.isDefault && (
            <TouchableOpacity
              style={tw`flex-1 bg-green-50 rounded-lg py-2.5 items-center border border-green-500`}
              onPress={() => handleSetDefault(upi.id)}
            >
              <Text style={tw`text-sm font-bold text-green-600`}>Set Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={tw`${upi.isDefault ? 'flex-1' : 'flex-1'} bg-gray-100 rounded-lg py-2.5 items-center`}
            onPress={() => navigation.navigate('EditUPI', { upi })}
          >
            <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`bg-red-50 rounded-lg px-4 py-2.5 items-center border border-red-500`}
            onPress={() => handleDelete(upi.id)}
          >
            <Icon name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderWallet = (wallet) => {
    return (
      <View
        key={wallet.id}
        style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm border ${wallet.isDefault ? 'border-green-500' : 'border-gray-200'}`}
      >
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`w-12 h-12 bg-blue-100 rounded-full justify-center items-center mr-3`}>
              <MaterialCommunityIcons name={wallet.icon} size={24} color="#2196F3" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-bold text-[#1A1A1A]`}>{wallet.name}</Text>
              <Text style={tw`text-lg font-bold text-green-600 mt-0.5`}>{wallet.balance}</Text>
              {wallet.isDefault && (
                <View style={tw`bg-green-100 self-start px-2 py-0.5 rounded-full mt-1`}>
                  <Text style={tw`text-xs font-bold text-green-700`}>Default</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={tw`flex-row gap-2`}>
          {!wallet.isDefault && (
            <TouchableOpacity
              style={tw`flex-1 bg-green-50 rounded-lg py-2.5 items-center border border-green-500`}
              onPress={() => handleSetDefault(wallet.id)}
            >
              <Text style={tw`text-sm font-bold text-green-600`}>Set Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={tw`${wallet.isDefault ? 'flex-1' : 'flex-1'} bg-blue-50 rounded-lg py-2.5 items-center border border-blue-500`}
            onPress={() => Alert.alert('Add Money', 'Add money feature coming soon')}
          >
            <Text style={tw`text-sm font-bold text-blue-600`}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`bg-red-50 rounded-lg px-4 py-2.5 items-center border border-red-500`}
            onPress={() => handleDelete(wallet.id)}
          >
            <Icon name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderNetBanking = (bank) => {
    return (
      <View
        key={bank.id}
        style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm border ${bank.isDefault ? 'border-green-500' : 'border-gray-200'}`}
      >
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`w-12 h-12 bg-indigo-100 rounded-full justify-center items-center mr-3`}>
              <MaterialCommunityIcons name={bank.icon} size={24} color="#4F46E5" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-bold text-[#1A1A1A]`}>{bank.bankName}</Text>
              <Text style={tw`text-sm text-gray-600 mt-0.5`}>{bank.accountNumber}</Text>
              {bank.isDefault && (
                <View style={tw`bg-green-100 self-start px-2 py-0.5 rounded-full mt-1`}>
                  <Text style={tw`text-xs font-bold text-green-700`}>Default</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={tw`flex-row gap-2`}>
          {!bank.isDefault && (
            <TouchableOpacity
              style={tw`flex-1 bg-green-50 rounded-lg py-2.5 items-center border border-green-500`}
              onPress={() => handleSetDefault(bank.id)}
            >
              <Text style={tw`text-sm font-bold text-green-600`}>Set Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={tw`${bank.isDefault ? 'flex-1' : 'flex-1'} bg-gray-100 rounded-lg py-2.5 items-center`}
            onPress={() => navigation.navigate('EditBank', { bank })}
          >
            <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`bg-red-50 rounded-lg px-4 py-2.5 items-center border border-red-500`}
            onPress={() => handleDelete(bank.id)}
          >
            <Icon name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPaymentMethod = (method) => {
    switch (method.type) {
      case 'card':
        return renderCard(method);
      case 'upi':
        return renderUPI(method);
      case 'wallet':
        return renderWallet(method);
      case 'netbanking':
        return renderNetBanking(method);
      default:
        return null;
    }
  };

  const cards = paymentMethods.filter(m => m.type === 'card');
  const others = paymentMethods.filter(m => m.type !== 'card');

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
              Payment Methods
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`p-4 pb-6`}
      >
        {/* Add New Payment Method */}
        <TouchableOpacity
          style={tw`bg-green-500 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-center`}
          onPress={() => navigation.navigate('AddPaymentMethod')}
          activeOpacity={0.7}
        >
          <Icon name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={tw`text-base font-bold text-white ml-2`}>
            Add Payment Method
          </Text>
        </TouchableOpacity>

        {/* Cards Section */}
        {cards.length > 0 && (
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-bold text-gray-500 uppercase tracking-wide mb-3`}>
              Cards ({cards.length})
            </Text>
            {cards.map(renderCard)}
          </View>
        )}

        {/* Other Payment Methods */}
        {others.length > 0 && (
          <View>
            <Text style={tw`text-sm font-bold text-gray-500 uppercase tracking-wide mb-3`}>
              Other Methods ({others.length})
            </Text>
            {others.map(renderPaymentMethod)}
          </View>
        )}

        {/* Empty State */}
        {paymentMethods.length === 0 && (
          <View style={tw`items-center justify-center py-20`}>
            <MaterialCommunityIcons name="credit-card-off-outline" size={80} color="#D1D5DB" />
            <Text style={tw`text-lg font-semibold text-gray-400 mt-4`}>
              No payment methods saved
            </Text>
            <Text style={tw`text-sm text-gray-400 mt-2`}>
              Add your first payment method to get started
            </Text>
          </View>
        )}

        {/* Info Box */}
        {paymentMethods.length > 0 && (
          <View style={tw`bg-blue-50 rounded-xl p-4 mt-2`}>
            <View style={tw`flex-row items-start`}>
              <Icon name="shield-checkmark" size={20} color="#3B82F6" />
              <Text style={tw`text-sm text-blue-700 ml-2 flex-1`}>
                Your payment information is encrypted and secure. We never store your CVV or PIN.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default PaymentMethodsScreen;