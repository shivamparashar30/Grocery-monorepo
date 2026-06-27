import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../../config/apiconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditional imports for optional dependencies
let MapView = null;
let Marker = null;
let PROVIDER_GOOGLE = null;
let Geolocation = null;

try {
  const MapViewModule = require('react-native-maps');
  MapView = MapViewModule.default;
  Marker = MapViewModule.Marker;
  PROVIDER_GOOGLE = MapViewModule.PROVIDER_GOOGLE;
} catch (e) {
  console.warn('react-native-maps not installed');
}

// Try to import Geolocation - check which library is installed
try {
  // First try @react-native-community/geolocation (most common)
  const GeoModule = require('@react-native-community/geolocation');
  Geolocation = GeoModule.default || GeoModule;
  console.log('Using @react-native-community/geolocation');
} catch (e) {
  try {
    // Fall back to react-native-geolocation-service
    const GeoServiceModule = require('react-native-geolocation-service');
    Geolocation = GeoServiceModule.default || GeoServiceModule;
    console.log('Using react-native-geolocation-service');
  } catch (err) {
    console.warn('No geolocation library installed');
  }
}

const { height } = Dimensions.get('window');

const MapSelectionScreen = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const [selectedType, setSelectedType] = useState('home');
  const [userDetails, setUserDetails] = useState({
    fullName: '',
    phone: '',
  });
  const [parsedLocation, setParsedLocation] = useState({
    city: '',
    state: '',
    pincode: '',
  });
  const [region, setRegion] = useState({
    latitude: 26.4499,
    longitude: 74.6399,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 26.4499,
    longitude: 74.6399,
  });
  const [address, setAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState({
    houseNumber: '',
    floor: '',
    landmark: '',
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Check if required dependencies are available
  if (!MapView || !Geolocation) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#FF5252" />
        <Text style={styles.errorTitle}>Map Dependencies Missing</Text>
        <Text style={styles.errorMessage}>
          Please install required packages:
          {'\n\n'}
          npm install react-native-maps{'\n'}
          npm install @react-native-community/geolocation
          {'\n\n'}
          Then follow the setup guide.
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    checkInitialPermission();
  }, []);

  useEffect(() => {
    // Check if we should get current location after permission is granted
    if (route?.params?.type === 'current' && hasLocationPermission) {
      getCurrentLocation();
    }
  }, [hasLocationPermission]);

  const checkInitialPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setHasLocationPermission(granted);

        if (!granted && route?.params?.type === 'current') {
          // If came from "use current location", request permission
          requestLocationPermission();
        }
      } else {
        setHasLocationPermission(true);
      }
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show your current position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasLocationPermission(hasPermission);

        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Location permission is required to use this feature. Please enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'android') {
                    // You can use react-native-permissions or Linking to open settings
                    Alert.alert('Info', 'Please enable location permission in Settings > Apps > Your App > Permissions');
                  }
                }
              }
            ]
          );
        }

        return hasPermission;
      } catch (err) {
        console.warn('Permission error:', err);
        Alert.alert('Error', 'Failed to request location permission');
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = async () => {
    try {
      console.log('Getting current location...');

      // Check if Geolocation is available
      if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
        Alert.alert(
          'Location Service Unavailable',
          'Geolocation library is not properly installed. Please run:\n\nnpm install @react-native-community/geolocation\n\nOr:\n\nnpm install react-native-geolocation-service',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Check permission first
      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          return;
        }
      }

      setLoading(true);

      // Add timeout wrapper
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 15000); // 15 second timeout

      Geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log('Location received:', position);

          const { latitude, longitude } = position.coords;
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };

          setRegion(newRegion);
          setMarkerPosition({ latitude, longitude });

          // Only animate if map is ready
          if (mapRef.current && mapReady) {
            setTimeout(() => {
              mapRef.current?.animateToRegion(newRegion, 1000);
            }, 100);
          }

          reverseGeocode(latitude, longitude);
          setLoading(false);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.log('Location error:', error.code, error.message);
          setLoading(false);

          let errorMessage = 'Unable to get your current location.';

          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied. Please enable it in settings.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location unavailable. Please check if location services are enabled.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Unable to get location. Please try again or set location manually.';
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          showLocationDialog: true,
          forceRequestLocation: true,
        }
      );
    } catch (error) {
      console.error('Location error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'GroceryApp/1.0',  // Nominatim requires a User-Agent
          },
        }
      );
      const data = await response.json();

      if (data && data.address) {
        const a = data.address;

        const displayAddress = [
          a.road || a.neighbourhood || a.suburb,
          a.city || a.town || a.village || a.county,
          a.state,
        ]
          .filter(Boolean)
          .join(', ');

        setAddress(displayAddress || data.display_name);

        // Store parsed parts for payload
        setParsedLocation({
          city: a.city || a.town || a.village || a.county || '',
          state: a.state || '',
          pincode: a.postcode || '',
        });
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  const handleMapPress = (event) => {
    try {
      const { coordinate } = event.nativeEvent;
      setMarkerPosition(coordinate);
      reverseGeocode(coordinate.latitude, coordinate.longitude);
    } catch (error) {
      console.error('Map press error:', error);
    }
  };

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
  };

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token'); // same key you use when saving token on login
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };


  const handleConfirmLocation = async () => {
    // Validate required user-filled fields
    if (!userDetails.fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }
    if (!userDetails.phone.trim() || userDetails.phone.length !== 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!addressDetails.houseNumber.trim()) {
      Alert.alert('Required', 'Please enter your house/flat number');
      return;
    }
    if (!address) {
      Alert.alert('Required', 'Please select a location on the map');
      return;
    }

    const payload = {
      fullName: userDetails.fullName.trim(),
      phone: userDetails.phone.trim(),
      addressLine1: addressDetails.houseNumber.trim(),
      addressLine2: addressDetails.floor.trim() || '',
      landmark: addressDetails.landmark.trim() || '',
      city: parsedLocation.city,
      state: parsedLocation.state,
      pincode: parsedLocation.pincode,
      country: 'India',
      addressType: selectedType,       // 'home' | 'work' | 'other'
      coordinates: {
        latitude: markerPosition.latitude,
        longitude: markerPosition.longitude,
      },
    };

    // Validate that reverse geocode gave us the required fields
    if (!payload.city || !payload.state || !payload.pincode) {
      Alert.alert(
        'Location Incomplete',
        'Could not detect city/pincode from map. Please try moving the pin slightly or check your internet connection.'
      );
      return;
    }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}/addresses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      if (route?.params?.onLocationSelect) route.params.onLocationSelect(data.data);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const moveToCurrentLocation = () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Location Permission',
        'Location permission is required to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: () => getCurrentLocation() }
        ]
      );
      return;
    }

    getCurrentLocation();
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={handleMapPress}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        onMapReady={() => {
          console.log('Map is ready');
          setMapReady(true);
        }}
        loadingEnabled={true}
        loadingIndicatorColor="#E91E63"
      >
        <Marker
          coordinate={markerPosition}
          draggable
          onDragEnd={(e) => {
            try {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setMarkerPosition({ latitude, longitude });
              reverseGeocode(latitude, longitude);
            } catch (error) {
              console.error('Marker drag error:', error);
            }
          }}
        >
          <View style={styles.markerContainer}>
            <Icon name="location" size={40} color="#E91E63" />
          </View>
        </Marker>
      </MapView>

      {/* Top Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.topContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Current Location Button */}
      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={moveToCurrentLocation}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#E91E63" size="small" />
        ) : (
          <Icon name="locate" size={24} color="#E91E63" />
        )}
      </TouchableOpacity>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />

        <View style={styles.addressSection}>
          <View style={styles.locationIconContainer}>
            <Icon name="location" size={24} color="#E91E63" />
          </View>
          <View style={styles.addressContent}>
            <Text style={styles.addressTitle}>
              {address || 'Select location on map'}
            </Text>
            <Text style={styles.addressSubtitle}>
              Drag the pin to adjust location
            </Text>
          </View>
        </View>

        {/* Address Details Form */}
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={userDetails.fullName}
            onChangeText={(text) => setUserDetails({ ...userDetails, fullName: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            value={userDetails.phone}
            onChangeText={(text) => setUserDetails({ ...userDetails, phone: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="House/Flat/Block No."
            placeholderTextColor="#999"
            value={addressDetails.houseNumber}
            onChangeText={(text) =>
              setAddressDetails({ ...addressDetails, houseNumber: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Floor (Optional)"
            placeholderTextColor="#999"
            value={addressDetails.floor}
            onChangeText={(text) =>
              setAddressDetails({ ...addressDetails, floor: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Nearby landmark (Optional)"
            placeholderTextColor="#999"
            value={addressDetails.landmark}
            onChangeText={(text) =>
              setAddressDetails({ ...addressDetails, landmark: text })
            }
          />
        </View>

        {/* Save Address Types */}
        <View style={styles.addressTypes}>
          <TouchableOpacity style={styles.addressTypeButton} onPress={() => setSelectedType('home')} >
            <Icon name="home" size={20} color="#666" />
            <Text style={styles.addressTypeText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressTypeButton}>
            <Icon name="briefcase" size={20} color="#666" />
            <Text style={styles.addressTypeText}>Work</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressTypeButton}>
            <Icon name="location" size={20} color="#666" />
            <Text style={styles.addressTypeText}>Other</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorButton: {
    marginTop: 24,
    backgroundColor: '#E91E63',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  topContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
    fontWeight: '500',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: height * 0.5,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: height * 0.75,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  addressSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  addressTypes: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addressTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
  },
  addressTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#E91E63',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default MapSelectionScreen;