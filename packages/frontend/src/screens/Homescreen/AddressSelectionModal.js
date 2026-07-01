import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, Dimensions, Platform, KeyboardAvoidingView,
  ActivityIndicator, Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAddress } from '../../context/AddressContext';

const { height } = Dimensions.get('window');

const TAG_ICONS = { home: 'home', work: 'briefcase', other: 'location' };
const TAG_COLORS = { home: '#3B82F6', work: '#8B5CF6', other: '#6B7280' };

const AddressSelectionModal = ({ visible, onClose, onAddressSelect }) => {
  const { savedAddresses, fetchSavedAddresses, userLocation } = useAddress();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      fetchSavedAddresses();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible, fetchSavedAddresses]);

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (text.length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        // Build location-biased search URL
        const refLat = userLocation?.latitude;
        const refLng = userLocation?.longitude;
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=8&addressdetails=1`;

        if (refLat && refLng) {
          const delta = 0.5; // ~50km bias box
          const viewbox = `${refLng - delta},${refLat + delta},${refLng + delta},${refLat - delta}`;
          url += `&viewbox=${viewbox}&bounded=0`;
        }

        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'GroceryApp/1.0' },
        });
        const data = await res.json();

        // Sort by distance from user (nearby first)
        if (data?.length && refLat && refLng) {
          data.sort((a, b) => {
            const dA = Math.abs(parseFloat(a.lat) - refLat) + Math.abs(parseFloat(a.lon) - refLng);
            const dB = Math.abs(parseFloat(b.lat) - refLat) + Math.abs(parseFloat(b.lon) - refLng);
            return dA - dB;
          });
        }

        setSearchResults((data || []).slice(0, 5));
      } catch {}
      setSearching(false);
    }, 500);
  }, [userLocation]);

  const handleSelectSearchResult = (result) => {
    onAddressSelect({
      type: 'search',
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
    });
    onClose();
  };

  const handleUseCurrentLocation = () => {
    onAddressSelect({ type: 'current' });
    onClose();
  };

  const handleAddNewAddress = () => {
    onAddressSelect({ type: 'new' });
    onClose();
  };

  const handleSelectSaved = (address) => {
    onAddressSelect({ type: 'saved', address });
    onClose();
  };

  const showSearchResults = searchQuery.length >= 3;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={onClose} />

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <View style={styles.closeBtnCircle}>
            <Icon name="close" size={28} color="#FFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Select delivery location</Text>

          {/* Search bar - FIXED at top, outside ScrollView */}
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, street name..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                <Icon name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>

          {/* Scrollable content below fixed search bar */}
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search results */}
            {showSearchResults && (
              <View style={styles.searchSection}>
                {searching && (
                  <ActivityIndicator size="small" color="#2BB77D" style={{ marginVertical: 16 }} />
                )}
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.place_id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(result)}
                  >
                    <View style={styles.searchResultIcon}>
                      <Icon name="location-outline" size={20} color="#2BB77D" />
                    </View>
                    <Text style={styles.searchResultText} numberOfLines={2}>
                      {result.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {!searching && searchResults.length === 0 && (
                  <Text style={styles.noResults}>No results found</Text>
                )}
              </View>
            )}

            {/* Main options - show when NOT searching */}
            {!showSearchResults && (
              <>
                {/* Use current location */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleUseCurrentLocation}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Icon name="locate" size={22} color="#2BB77D" />
                  </View>
                  <Text style={styles.optionText}>Use your current location</Text>
                  <Icon name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* Add new address */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleAddNewAddress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Icon name="add" size={22} color="#2BB77D" />
                  </View>
                  <Text style={styles.optionText}>Add new address</Text>
                  <Icon name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* Saved addresses */}
                {savedAddresses.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>YOUR SAVED ADDRESSES</Text>
                    {savedAddresses.map((addr) => {
                      const icon = TAG_ICONS[addr.addressType] || 'location';
                      const color = TAG_COLORS[addr.addressType] || '#6B7280';
                      const label =
                        addr.customTag ||
                        (addr.addressType === 'work'
                          ? 'Office'
                          : (addr.addressType || 'home').charAt(0).toUpperCase() +
                            (addr.addressType || 'home').slice(1));

                      return (
                        <TouchableOpacity
                          key={addr._id}
                          style={styles.addrCard}
                          onPress={() => handleSelectSaved(addr)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.addrIcon, { backgroundColor: color + '15' }]}>
                            <Icon name={icon} size={22} color={color} />
                          </View>
                          <View style={styles.addrInfo}>
                            <View style={styles.addrHeader}>
                              <Text style={styles.addrLabel}>{label}</Text>
                              {addr.isDefault && (
                                <View style={styles.defaultBadge}>
                                  <Text style={styles.defaultBadgeText}>Default</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.addrName}>{addr.fullName}</Text>
                            <Text style={styles.addrText} numberOfLines={2}>
                              {[addr.addressLine1, addr.city, addr.pincode]
                                .filter(Boolean)
                                .join(', ')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  overlayBg: { flex: 1 },
  closeBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center', zIndex: 10,
  },
  closeBtnCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: {
    backgroundColor: '#F5F5F5', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: height * 0.85, paddingTop: 24, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 18 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500', padding: 0 },
  scroll: { flex: 1 },
  searchSection: { marginBottom: 12 },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 12,
  },
  searchResultIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
  },
  searchResultText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  noResults: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 20 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, padding: 14, marginBottom: 10, gap: 14,
  },
  optionIcon: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#999',
    marginTop: 20, marginBottom: 12, letterSpacing: 0.5,
  },
  addrCard: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12,
    padding: 14, marginBottom: 10, gap: 12,
  },
  addrIcon: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  addrInfo: { flex: 1 },
  addrHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addrLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  defaultBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: '#2BB77D' },
  addrName: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 2 },
  addrText: { fontSize: 13, color: '#888', lineHeight: 18 },
});

export default AddressSelectionModal;
