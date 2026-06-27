import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BASE_URL } from '../../config/apiconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const AddressSelectionModal = ({ visible, onClose, onAddressSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    if (visible) fetchSavedAddresses();
  }, [visible]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };


  const fetchSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}/addresses`, {
        headers,
      });
      const data = await response.json();
      if (data.success) setSavedAddresses(data.data);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby delivery options.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const handleUseCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();

      if (hasPermission) {
        // Just pass the type, let MapSelectionScreen handle getting location
        onAddressSelect({
          type: 'current',
        });
        onClose();
      } else {
        Alert.alert(
          'Permission Required',
          'Location permission is required to use this feature. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
      Alert.alert('Error', 'Failed to request location permission. Please try again.');
    }
  };

  const handleAddNewAddress = () => {
    try {
      onAddressSelect({ type: 'new', fullName: '', phone: '', });
      onClose();
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to open map screen. Please try again.');
    }
  };

  const handleSelectAddress = (address) => {
    try {
      onAddressSelect({
        type: 'saved',
        address,
      });
      onClose();
    } catch (error) {
      console.error('Address selection error:', error);
    }
  };

  const handleImportFromZomato = () => {
    Alert.alert('Coming Soon', 'Import from Zomato feature will be available soon!');
  };

  const handleRequestAddress = () => {
    Alert.alert('Coming Soon', 'Request address via WhatsApp feature will be available soon!');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        {/* Touchable overlay to close modal */}
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <View style={styles.closeButtonCircle}>
            <Icon name="close" size={28} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Modal Content */}
        <View style={styles.modalContent}>
          {/* Header */}
          <Text style={styles.modalTitle}>Select delivery location</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={22} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street name..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Use Current Location */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleUseCurrentLocation}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, styles.locationIcon]}>
                  <Icon name="locate" size={24} color="#00C853" />
                </View>
                <Text style={styles.optionText}>Use your current location</Text>
              </View>
              <Icon name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>

            {/* Add New Address */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleAddNewAddress}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, styles.addIcon]}>
                  <Icon name="add" size={24} color="#00C853" />
                </View>
                <Text style={styles.optionText}>Add new address</Text>
              </View>
              <Icon name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>

            {/* Import from Zomato */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleImportFromZomato}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, styles.zomatoIcon]}>
                  <Text style={styles.zomatoText}>z</Text>
                </View>
                <Text style={styles.optionText}>Import your addresses from Zomato</Text>
              </View>
              <Icon name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>

            {/* Request Address from WhatsApp */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleRequestAddress}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, styles.whatsappIcon]}>
                  <MaterialCommunityIcons name="whatsapp" size={24} color="#FFF" />
                </View>
                <Text style={styles.optionText}>Request address from someone else</Text>
              </View>
              <Icon name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>

            {/* Saved Addresses Section */}
            <Text style={styles.savedAddressesTitle}>Your saved addresses</Text>

            {savedAddresses.map((address) => (
              <TouchableOpacity
                key={address._id}
                style={styles.addressCard}
                onPress={() => handleSelectAddress(address)}
                activeOpacity={0.7}
              >
                <View style={styles.addressLeft}>
                  <View style={styles.homeIconContainer}>
                    <Icon name="home" size={28} color="#FF9800" />
                  </View>
                  <View style={styles.addressInfo}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressLabel}>
                        {address.addressType?.charAt(0).toUpperCase() + address.addressType?.slice(1)}
                      </Text>
                      <Text style={styles.addressText}>{address.fullName}</Text>
                    </View>
                    <Text style={styles.addressText} numberOfLines={2}>
                      {[address.addressLine1, address.addressLine2, address.landmark, address.city, address.state, address.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                    <Text style={styles.phoneText}>Phone number: {address.phone}</Text>
                  </View>
                </View>

                <View style={styles.addressActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert('Edit Address', 'Edit address feature coming soon!');
                    }}
                  >
                    <Icon name="ellipsis-horizontal" size={20} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert('Share Address', 'Share address feature coming soon!');
                    }}
                  >
                    <Icon name="share-outline" size={20} color="#00C853" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalContent: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.9,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationIcon: {
    backgroundColor: '#E8F5E9',
  },
  addIcon: {
    backgroundColor: '#E8F5E9',
  },
  zomatoIcon: {
    backgroundColor: '#E23744',
  },
  zomatoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  whatsappIcon: {
    backgroundColor: '#25D366',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  savedAddressesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginTop: 24,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  addressLeft: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  homeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addressDistance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00BCD4',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  phoneText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default AddressSelectionModal;