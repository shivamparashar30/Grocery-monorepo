import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Platform,
  PermissionsAndroid, ActivityIndicator, Alert, Dimensions,
  KeyboardAvoidingView, ScrollView, Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_URL } from '../../config/apiconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAddress } from '../../context/AddressContext';

let MapView = null;
let Marker = null;
let PROVIDER_GOOGLE = null;
let Geolocation = null;

try {
  const M = require('react-native-maps');
  MapView = M.default;
  Marker = M.Marker;
  PROVIDER_GOOGLE = M.PROVIDER_GOOGLE;
} catch (e) {
  console.warn('react-native-maps not installed');
}

try {
  const G = require('@react-native-community/geolocation');
  Geolocation = G.default || G;
} catch {
  try {
    const GS = require('react-native-geolocation-service');
    Geolocation = GS.default || GS;
  } catch {
    console.warn('No geolocation library');
  }
}

const { height } = Dimensions.get('window');

const TAGS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'work', label: 'Office', icon: 'briefcase' },
  { key: 'other', label: 'Other', icon: 'pricetag' },
];

const MapSelectionScreen = ({ navigation, route }) => {
  const { fetchSavedAddresses, selectAddress, userLocation } = useAddress();
  const insets = useSafeAreaInsets();
  const editAddress = route?.params?.editAddress;
  const isEdit = !!editAddress?._id;
  const initLat = route?.params?.latitude || editAddress?.coordinates?.latitude || 26.4499;
  const initLng = route?.params?.longitude || editAddress?.coordinates?.longitude || 74.6399;

  const mapRef = useRef(null);
  const searchTimerRef = useRef(null);
  const pendingRegionRef = useRef(null);
  const scrollRef = useRef(null);

  // Map state
  const [region, setRegion] = useState({
    latitude: initLat, longitude: initLng, latitudeDelta: 0.005, longitudeDelta: 0.005,
  });
  const [markerPos, setMarkerPos] = useState({ latitude: initLat, longitude: initLng });
  const [address, setAddress] = useState('');
  const [parsedLoc, setParsedLoc] = useState({
    city: editAddress?.city || '', state: editAddress?.state || '', pincode: editAddress?.pincode || '',
  });
  const [mapReady, setMapReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(Platform.OS === 'ios');
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(editAddress?.fullName || '');
  const [phone, setPhone] = useState(editAddress?.phone || '');
  const [houseNo, setHouseNo] = useState(editAddress?.addressLine1 || '');
  const [floor, setFloor] = useState(editAddress?.addressLine2 || '');
  const [landmark, setLandmark] = useState(editAddress?.landmark || '');
  const [selectedTag, setSelectedTag] = useState(editAddress?.addressType || 'home');
  const [customTag, setCustomTag] = useState(editAddress?.customTag || '');

  // ── Permission ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'android') {
      (async () => {
        let granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (!granted) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'We need your location to detect your address.',
              buttonPositive: 'Allow',
            }
          );
          granted = result === PermissionsAndroid.RESULTS.GRANTED;
        }
        setHasPermission(granted);
      })();
    }
  }, []);

  // ── Auto-detect location on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!hasPermission) return;
    if (isEdit) {
      reverseGeocode(initLat, initLng);
    } else if (route?.params?.latitude) {
      reverseGeocode(initLat, initLng);
    } else {
      getCurrentLocation();
    }
  }, [hasPermission]);

  // ── Geolocation ──────────────────────────────────────────────────────────────
  const getCurrentLocation = useCallback(() => {
    if (!Geolocation || !hasPermission) return;
    setLoading(true);
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const r = { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
        setRegion(r);
        setMarkerPos({ latitude, longitude });
        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion(r, 1000);
        } else {
          pendingRegionRef.current = r;
        }
        reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          Alert.alert('Permission Denied', 'Enable location in your device settings.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [hasPermission, mapReady]);

  // ── Reverse geocode ──────────────────────────────────────────────────────────
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'GroceryApp/1.0' } }
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        const display = [
          a.road || a.neighbourhood || a.suburb,
          a.city || a.town || a.village || a.county,
          a.state,
        ].filter(Boolean).join(', ');
        setAddress(display || data.display_name);
        setParsedLoc({
          city: a.city || a.town || a.village || a.county || '',
          state: a.state || '',
          pincode: a.postcode || '',
        });
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  // ── Search with location bias ─────────────────────────────────────────────────
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (text.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        // Build location-biased search URL
        const refLat = userLocation?.latitude || markerPos.latitude;
        const refLng = userLocation?.longitude || markerPos.longitude;
        const delta = 0.5; // ~50km bias box
        const viewbox = `${refLng - delta},${refLat + delta},${refLng + delta},${refLat - delta}`;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=8&addressdetails=1&viewbox=${viewbox}&bounded=0`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'GroceryApp/1.0' } }
        );
        const results = await res.json();
        // Sort by distance from user location (nearby first)
        if (results?.length && refLat && refLng) {
          results.sort((a, b) => {
            const dA = Math.abs(parseFloat(a.lat) - refLat) + Math.abs(parseFloat(a.lon) - refLng);
            const dB = Math.abs(parseFloat(b.lat) - refLat) + Math.abs(parseFloat(b.lon) - refLng);
            return dA - dB;
          });
        }
        setSearchResults((results || []).slice(0, 5));
        setShowResults(results?.length > 0);
      } catch {}
    }, 500);
  }, [userLocation, markerPos]);

  const selectSearchResult = useCallback((result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const r = { latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 };
    setRegion(r);
    setMarkerPos({ latitude: lat, longitude: lng });
    mapRef.current?.animateToRegion(r, 1000);
    reverseGeocode(lat, lng);
    setSearchQuery(
      result.display_name?.split(',').slice(0, 2).join(',').trim() || ''
    );
    setShowResults(false);
    Keyboard.dismiss();
  }, []);

  // ── Map interaction ──────────────────────────────────────────────────────────
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPos({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const handleMapReady = () => {
    setMapReady(true);
    if (pendingRegionRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(pendingRegionRef.current, 1000);
        pendingRegionRef.current = null;
      }, 100);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const handleSave = async () => {
    if (!fullName.trim()) return Alert.alert('Required', 'Please enter your full name');
    if (!phone.trim() || phone.length !== 10) return Alert.alert('Required', 'Enter a valid 10-digit phone number');
    if (!houseNo.trim()) return Alert.alert('Required', 'Please enter your house/flat number');
    if (!address) return Alert.alert('Required', 'Select a location on the map');
    if (!parsedLoc.city || !parsedLoc.pincode) {
      return Alert.alert('Incomplete', 'Could not detect city/pincode. Try moving the pin.');
    }
    if (selectedTag === 'other' && !customTag.trim()) {
      return Alert.alert('Required', 'Please name this address');
    }

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: houseNo.trim(),
      addressLine2: floor.trim(),
      landmark: landmark.trim(),
      city: parsedLoc.city,
      state: parsedLoc.state,
      pincode: parsedLoc.pincode,
      country: 'India',
      addressType: selectedTag,
      customTag: selectedTag === 'other' ? customTag.trim() : '',
      coordinates: { latitude: markerPos.latitude, longitude: markerPos.longitude },
    };

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const url = isEdit
        ? `${BASE_URL}/addresses/${editAddress._id}`
        : `${BASE_URL}/addresses`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      selectAddress(data.data);
      fetchSavedAddresses();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to focused input
  const handleInputFocus = (yOffset) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 300);
  };

  // ── Error state ──────────────────────────────────────────────────────────────
  if (!MapView || !Geolocation) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#FF5252" />
        <Text style={styles.errorTitle}>Map Dependencies Missing</Text>
        <Text style={styles.errorText}>
          Install react-native-maps and geolocation libraries.
        </Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Map area */}
      <View style={{ flex: 1, minHeight: 120 }}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation={hasPermission}
          showsMyLocationButton={false}
          onMapReady={handleMapReady}
          loadingEnabled
        >
          <Marker
            coordinate={markerPos}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setMarkerPos({ latitude, longitude });
              reverseGeocode(latitude, longitude);
            }}
          >
            <View style={styles.markerWrap}>
              <Icon name="location" size={40} color="#2BB77D" />
            </View>
          </Marker>
        </MapView>

        {/* Top bar overlay */}
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <View style={styles.topContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <View style={styles.searchBox}>
              <Icon name="search" size={18} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for area, street..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                >
                  <Icon name="close-circle" size={18} color="#CCC" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search results dropdown */}
          {showResults && (
            <View style={styles.searchResults}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.searchItem}
                    onPress={() => selectSearchResult(item)}
                  >
                    <Icon name="location-outline" size={20} color="#2BB77D" style={{ marginTop: 2 }} />
                    <Text style={styles.searchItemText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>

        {/* GPS locate button */}
        <TouchableOpacity
          style={styles.gpsFab}
          onPress={getCurrentLocation}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#2BB77D" size="small" />
          ) : (
            <Icon name="locate" size={24} color="#2BB77D" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom card */}
      <View style={styles.bottomCard}>
          <View style={styles.dragHandle} />

          {/* Scrollable form */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Detected address */}
            <View style={styles.addrRow}>
              <View style={styles.addrIconWrap}>
                <Icon name="location" size={22} color="#2BB77D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addrTitle} numberOfLines={2}>
                  {address || 'Select location on map'}
                </Text>
                <Text style={styles.addrSub}>Drag the pin to adjust location</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Form fields */}
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => handleInputFocus(0)}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              onFocus={() => handleInputFocus(50)}
            />
            <TextInput
              style={styles.input}
              placeholder="House / Flat / Block No. *"
              placeholderTextColor="#999"
              value={houseNo}
              onChangeText={setHouseNo}
              onFocus={() => handleInputFocus(100)}
            />
            <TextInput
              style={styles.input}
              placeholder="Floor (Optional)"
              placeholderTextColor="#999"
              value={floor}
              onChangeText={setFloor}
              onFocus={() => handleInputFocus(150)}
            />
            <TextInput
              style={styles.input}
              placeholder="Nearby Landmark (Optional)"
              placeholderTextColor="#999"
              value={landmark}
              onChangeText={setLandmark}
              onFocus={() => handleInputFocus(200)}
            />

            {/* Address tag selection */}
            <Text style={styles.tagLabel}>Save as</Text>
            <View style={styles.tagRow}>
              {TAGS.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tagBtn, selectedTag === t.key && styles.tagBtnActive]}
                  onPress={() => setSelectedTag(t.key)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={t.icon}
                    size={16}
                    color={selectedTag === t.key ? '#FFF' : '#666'}
                  />
                  <Text
                    style={[styles.tagBtnText, selectedTag === t.key && styles.tagBtnTextActive]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom tag input (when Other is selected) */}
            {selectedTag === 'other' && (
              <TextInput
                style={styles.input}
                placeholder="Name this address (e.g., Gym, Mom's House)"
                placeholderTextColor="#999"
                value={customTag}
                onChangeText={setCustomTag}
                maxLength={30}
                onFocus={() => handleInputFocus(300)}
              />
            )}
          </ScrollView>

          {/* Sticky Save button - always visible above keyboard */}
          <View style={[styles.saveBtnContainer, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12 }]}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {isEdit ? 'Update Address' : 'Save Address'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFF',
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginTop: 16 },
  errorText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  errorBtn: {
    marginTop: 24, backgroundColor: '#2BB77D', paddingHorizontal: 32,
    paddingVertical: 12, borderRadius: 12,
  },
  errorBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  markerWrap: { alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topContent: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 12, gap: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500', padding: 0 },
  searchResults: {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#FFF', borderRadius: 12,
    maxHeight: 220, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  searchItem: {
    flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0', gap: 12,
  },
  searchItemText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  gpsFab: {
    position: 'absolute', right: 16, bottom: 16, width: 48, height: 48,
    borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  bottomCard: {
    maxHeight: height * 0.55, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  dragHandle: {
    width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  addrIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
  },
  addrTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  addrSub: { fontSize: 13, color: '#999' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
  input: {
    backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 15, color: '#1A1A1A', marginBottom: 12,
  },
  tagLabel: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 10, marginTop: 4 },
  tagRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tagBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 10, gap: 6,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  tagBtnActive: { backgroundColor: '#2BB77D', borderColor: '#2BB77D' },
  tagBtnText: { fontSize: 13, fontWeight: '600', color: '#666' },
  tagBtnTextActive: { color: '#FFF' },
  saveBtnContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  saveBtn: {
    backgroundColor: '#2BB77D', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#2BB77D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

export default MapSelectionScreen;
