import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import tw from '../../utils/tailwind';

const AddPaymentMethodScreen = ({ navigation }) => {
  const [selectedMethod, setSelectedMethod] = useState('card'); // card, upi, wallet, netbanking
  
  // Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // UPI States
  const [upiId, setUpiId] = useState('');
  const [upiProvider, setUpiProvider] = useState('');
  
  // Wallet States
  const [walletProvider, setWalletProvider] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  
  // Net Banking States
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const paymentTypes = [
    { 
      id: 'card', 
      label: 'Card', 
      icon: 'card',
      iconType: 'Ionicons',
      color: '#2196F3'
    },
    { 
      id: 'upi', 
      label: 'UPI', 
      icon: 'qrcode-scan',
      iconType: 'MaterialCommunityIcons',
      color: '#7C3AED'
    },
    { 
      id: 'wallet', 
      label: 'Wallet', 
      icon: 'wallet',
      iconType: 'Ionicons',
      color: '#FF9800'
    },
    { 
      id: 'netbanking', 
      label: 'Net Banking', 
      icon: 'bank',
      iconType: 'MaterialCommunityIcons',
      color: '#4F46E5'
    },
  ];

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g);
    return formatted ? formatted.join(' ') : cleaned;
  };

  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\s/g, '');
    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumber(cleaned));
    }
  };

  const handleExpiryDateChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setExpiryDate(formatExpiryDate(cleaned));
    }
  };

  const handleCvvChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      setCvv(cleaned);
    }
  };

  const validateCard = () => {
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Error', 'Please enter a valid 16-digit card number');
      return false;
    }
    if (!cardHolder.trim()) {
      Alert.alert('Error', 'Please enter card holder name');
      return false;
    }
    if (expiryDate.length !== 5) {
      Alert.alert('Error', 'Please enter valid expiry date (MM/YY)');
      return false;
    }
    if (cvv.length !== 3) {
      Alert.alert('Error', 'Please enter valid CVV');
      return false;
    }
    return true;
  };

  const validateUPI = () => {
    if (!upiId.trim() || !upiId.includes('@')) {
      Alert.alert('Error', 'Please enter a valid UPI ID (e.g., name@upi)');
      return false;
    }
    return true;
  };

  const validateWallet = () => {
    if (!walletProvider.trim()) {
      Alert.alert('Error', 'Please select wallet provider');
      return false;
    }
    if (walletPhone.length !== 10) {
      Alert.alert('Error', 'Please enter valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const validateNetBanking = () => {
    if (!bankName.trim()) {
      Alert.alert('Error', 'Please enter bank name');
      return false;
    }
    if (!accountNumber.trim()) {
      Alert.alert('Error', 'Please enter account number');
      return false;
    }
    if (ifscCode.length !== 11) {
      Alert.alert('Error', 'Please enter valid 11-character IFSC code');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    let isValid = false;

    switch (selectedMethod) {
      case 'card':
        isValid = validateCard();
        break;
      case 'upi':
        isValid = validateUPI();
        break;
      case 'wallet':
        isValid = validateWallet();
        break;
      case 'netbanking':
        isValid = validateNetBanking();
        break;
    }

    if (!isValid) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Payment method added successfully', [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]);
    }, 1500);
  };

  const renderMethodSelector = () => {
    return (
      <View style={tw`mb-6`}>
        <Text style={tw`text-sm font-bold text-gray-700 mb-3`}>
          Select Payment Type
        </Text>
        <View style={tw`flex-row flex-wrap gap-3`}>
          {paymentTypes.map((type) => {
            const isSelected = selectedMethod === type.id;
            const IconComponent = type.iconType === 'MaterialCommunityIcons' 
              ? MaterialCommunityIcons 
              : Icon;

            return (
              <TouchableOpacity
                key={type.id}
                style={tw`flex-1 min-w-[45%] bg-white rounded-xl p-4 items-center border-2 ${
                  isSelected ? 'border-green-500' : 'border-gray-200'
                }`}
                onPress={() => setSelectedMethod(type.id)}
                activeOpacity={0.7}
              >
                <View 
                  style={[
                    tw`w-12 h-12 rounded-full justify-center items-center mb-2`,
                    { backgroundColor: `${type.color}20` }
                  ]}
                >
                  <IconComponent name={type.icon} size={24} color={type.color} />
                </View>
                <Text style={tw`text-sm font-semibold text-[#1A1A1A]`}>
                  {type.label}
                </Text>
                {isSelected && (
                  <View style={tw`absolute top-2 right-2`}>
                    <Icon name="checkmark-circle" size={20} color="#4CAF50" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderCardForm = () => {
    return (
      <View>
        <Text style={tw`text-lg font-bold text-[#1A1A1A] mb-4`}>
          Card Details
        </Text>

        {/* Card Number */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            Card Number
          </Text>
          <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
            <Icon name="card-outline" size={20} color="#666" />
            <TextInput
              style={tw`flex-1 text-base text-[#1A1A1A] ml-3`}
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              maxLength={19}
            />
          </View>
        </View>

        {/* Card Holder */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            Card Holder Name
          </Text>
          <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
            <Icon name="person-outline" size={20} color="#666" />
            <TextInput
              style={tw`flex-1 text-base text-[#1A1A1A] ml-3`}
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder="Neha"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Expiry Date & CVV */}
        <View style={tw`flex-row gap-3 mb-4`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
              Expiry Date
            </Text>
            <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
              <Icon name="calendar-outline" size={20} color="#666" />
              <TextInput
                style={tw`flex-1 text-base text-[#1A1A1A] ml-3`}
                value={expiryDate}
                onChangeText={handleExpiryDateChange}
                placeholder="MM/YY"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
              CVV
            </Text>
            <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
              <Icon name="lock-closed-outline" size={20} color="#666" />
              <TextInput
                style={tw`flex-1 text-base text-[#1A1A1A] ml-3`}
                value={cvv}
                onChangeText={handleCvvChange}
                placeholder="123"
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderUPIForm = () => {
    return (
      <View>
        <Text style={tw`text-lg font-bold text-[#1A1A1A] mb-4`}>
          UPI Details
        </Text>

        {/* UPI ID */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            UPI ID
          </Text>
          <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
            <MaterialCommunityIcons name="at" size={20} color="#666" />
            <TextInput
              style={tw`flex-1 text-base text-[#1A1A1A] ml-3`}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="yourname@paytm"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Provider Name (Optional) */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            Provider Name (Optional)
          </Text>
          <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
            <Icon name="apps-outline" size={20} color="#666" />
            <TextInput
              style={tw`flex-1 text-base text-[#1A1A1A] ml-3`}
              value={upiProvider}
              onChangeText={setUpiProvider}
              placeholder="Paytm, Google Pay, PhonePe"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={tw`bg-purple-50 rounded-xl p-4`}>
          <View style={tw`flex-row items-start`}>
            <Icon name="information-circle" size={20} color="#7C3AED" />
            <Text style={tw`text-sm text-purple-700 ml-2 flex-1`}>
              You'll receive a notification to verify this UPI ID when you make a payment.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWalletForm = () => {
    const wallets = ['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay', 'MobiKwik'];

    return (
      <View>
        <Text style={tw`text-lg font-bold text-[#1A1A1A] mb-4`}>
          Wallet Details
        </Text>

        {/* Wallet Provider */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            Select Wallet
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet}
                style={tw`bg-white rounded-lg px-4 py-2 border ${
                  walletProvider === wallet ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
                onPress={() => setWalletProvider(wallet)}
              >
                <Text style={tw`text-sm font-semibold ${
                  walletProvider === wallet ? 'text-green-600' : 'text-gray-700'
                }`}>
                  {wallet}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Phone Number */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            Phone Number
          </Text>
          <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
            <Icon name="call-outline" size={20} color="#666" />
            <Text style={tw`text-base text-gray-600 ml-3`}>+91</Text>
            <TextInput
              style={tw`flex-1 text-base text-[#1A1A1A] ml-2`}
              value={walletPhone}
              onChangeText={(text) => setWalletPhone(text.replace(/\D/g, ''))}
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={tw`bg-orange-50 rounded-xl p-4`}>
          <View style={tw`flex-row items-start`}>
            <Icon name="information-circle" size={20} color="#FF9800" />
            <Text style={tw`text-sm text-orange-700 ml-2 flex-1`}>
              Make sure this phone number is linked to your {walletProvider || 'wallet'} account.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderNetBankingForm = () => {
    const banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank'];

    return (
      <View>
        <Text style={tw`text-lg font-bold text-[#1A1A1A] mb-4`}>
          Net Banking Details
        </Text>

        {/* Bank Selection */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            Select Bank
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {banks.map((bank) => (
              <TouchableOpacity
                key={bank}
                style={tw`bg-white rounded-lg px-4 py-2 border ${
                  bankName === bank ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
                onPress={() => setBankName(bank)}
              >
                <Text style={tw`text-sm font-semibold ${
                  bankName === bank ? 'text-green-600' : 'text-gray-700'
                }`}>
                  {bank}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Number */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            Account Number
          </Text>
          <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
            <MaterialCommunityIcons name="bank" size={20} color="#666" />
            <TextInput
              style={tw`flex-1 text-base text-[#1A1A1A] ml-3`}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter account number"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* IFSC Code */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            IFSC Code
          </Text>
          <View style={tw`bg-white rounded-xl px-4 py-3 border border-gray-200 flex-row items-center`}>
            <Icon name="code-outline" size={20} color="#666" />
            <TextInput
              style={tw`flex-1 text-base text-[#1A1A1A] ml-3`}
              value={ifscCode}
              onChangeText={(text) => setIfscCode(text.toUpperCase())}
              placeholder="HDFC0001234"
              autoCapitalize="characters"
              maxLength={11}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={tw`bg-indigo-50 rounded-xl p-4`}>
          <View style={tw`flex-row items-start`}>
            <Icon name="information-circle" size={20} color="#4F46E5" />
            <Text style={tw`text-sm text-indigo-700 ml-2 flex-1`}>
              You'll be redirected to your bank's net banking page for authentication during payment.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderForm = () => {
    switch (selectedMethod) {
      case 'card':
        return renderCardForm();
      case 'upi':
        return renderUPIForm();
      case 'wallet':
        return renderWalletForm();
      case 'netbanking':
        return renderNetBankingForm();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-gray-50`}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={tw`bg-white shadow-sm`}>
        <View style={tw`flex-row items-center px-4 py-3`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`mr-3`}
          >
            <Icon name="chevron-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={tw`text-lg font-semibold text-[#1A1A1A]`}>
            Add Payment Method
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`p-4 pb-6`}
      >
        {/* Method Selector */}
        {renderMethodSelector()}

        {/* Form */}
        {renderForm()}

        {/* Set as Default */}
        <TouchableOpacity
          style={tw`flex-row items-center justify-between bg-white rounded-xl p-4 mt-4`}
          onPress={() => setSetAsDefault(!setAsDefault)}
        >
          <View style={tw`flex-row items-center flex-1`}>
            <Icon name="star" size={20} color="#FF9800" />
            <Text style={tw`text-base font-semibold text-[#1A1A1A] ml-3`}>
              Set as default payment method
            </Text>
          </View>
          <View style={tw`w-6 h-6 rounded-full border-2 ${setAsDefault ? 'border-green-500 bg-green-500' : 'border-gray-300'} justify-center items-center`}>
            {setAsDefault && <Icon name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Submit Button */}
      <SafeAreaView edges={['bottom']} style={tw`bg-white border-t border-gray-200`}>
        <View style={tw`px-4 py-3`}>
          <TouchableOpacity
            style={tw`bg-green-500 rounded-xl py-4 items-center shadow-sm ${isLoading ? 'opacity-50' : ''}`}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={tw`text-base font-bold text-white`}>
              {isLoading ? 'Adding...' : 'Add Payment Method'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default AddPaymentMethodScreen;