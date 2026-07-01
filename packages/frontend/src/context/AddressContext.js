import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/apiconfig';

let Geolocation = null;
try {
  const G = require('@react-native-community/geolocation');
  Geolocation = G.default || G;
} catch {
  try {
    const GS = require('react-native-geolocation-service');
    Geolocation = GS.default || GS;
  } catch {}
}

const AddressContext = createContext();

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const AddressProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [nearestStore, setNearestStore] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const initialLoad = useRef(true);

  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, []);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'GroceryApp/1.0' } }
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        return {
          displayAddress: [a.road || a.neighbourhood || a.suburb, a.city || a.town || a.village || a.county, a.state].filter(Boolean).join(', ') || data.display_name,
          city: a.city || a.town || a.village || a.county || '',
          state: a.state || '',
          pincode: a.postcode || '',
        };
      }
    } catch {}
    return null;
  }, []);

  const findNearestStore = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`${BASE_URL}/stores?isActive=true`);
      const data = await res.json();
      if (data.success && data.data?.length) {
        let nearest = null;
        let minDist = Infinity;
        data.data.forEach((s) => {
          if (s.coordinates?.latitude) {
            const d = haversine(lat, lng, s.coordinates.latitude, s.coordinates.longitude);
            if (d < minDist) {
              minDist = d;
              nearest = { ...s, distance: d };
            }
          }
        });
        if (nearest) setNearestStore(nearest);
      }
    } catch {}
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need your location for delivery.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }, []);

  const fetchCurrentLocation = useCallback(async () => {
    if (!Geolocation) {
      setLocationLoading(false);
      return;
    }
    const ok = await requestPermission();
    if (!ok) {
      setLocationLoading(false);
      return;
    }
    setLocationLoading(true);
    Geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });
        const geo = await reverseGeocode(latitude, longitude);
        if (geo) setCurrentAddress(geo);
        findNearestStore(latitude, longitude);
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [requestPermission, reverseGeocode, findNearestStore]);

  const fetchSavedAddresses = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/addresses`, { headers });
      const data = await res.json();
      if (data.success) setSavedAddresses(data.data || []);
    } catch {}
  }, [getAuthHeaders]);

  const selectAddress = useCallback((address) => {
    setSelectedAddress(address);
  }, []);

  // Initial load
  useEffect(() => {
    if (!initialLoad.current) return;
    initialLoad.current = false;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BASE_URL}/addresses/default`, { headers });
        const data = await res.json();
        if (data.success && data.data) setSelectedAddress(data.data);
      } catch {}
      fetchCurrentLocation();
      fetchSavedAddresses();
    })();
  }, [getAuthHeaders, fetchCurrentLocation, fetchSavedAddresses]);

  const addressDisplayText = useMemo(() => {
    if (selectedAddress) {
      const type = selectedAddress.addressType || 'home';
      const label = type === 'work' ? 'Office' : type.charAt(0).toUpperCase() + type.slice(1);
      return selectedAddress.customTag || label;
    }
    if (userLocation && currentAddress) return 'Current Location';
    return 'Select delivery address';
  }, [selectedAddress, userLocation, currentAddress]);

  const addressSubText = useMemo(() => {
    if (selectedAddress) {
      return [selectedAddress.addressLine1, selectedAddress.city].filter(Boolean).join(', ');
    }
    return currentAddress?.displayAddress || '';
  }, [selectedAddress, currentAddress]);

  const value = useMemo(
    () => ({
      userLocation,
      currentAddress,
      selectedAddress,
      savedAddresses,
      nearestStore,
      locationLoading,
      addressDisplayText,
      addressSubText,
      fetchCurrentLocation,
      fetchSavedAddresses,
      selectAddress,
      reverseGeocode,
    }),
    [
      userLocation, currentAddress, selectedAddress, savedAddresses, nearestStore,
      locationLoading, addressDisplayText, addressSubText,
      fetchCurrentLocation, fetchSavedAddresses, selectAddress, reverseGeocode,
    ]
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
};

export const useAddress = () => useContext(AddressContext);
