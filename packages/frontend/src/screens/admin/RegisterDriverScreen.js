import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_URL } from '../../config/apiconfig';

const VEHICLE_TYPES = [
  { id: 'bike', label: 'Bike', icon: 'bicycle' },
  { id: 'scooter', label: 'Scooter', icon: 'bicycle' },
  { id: 'car', label: 'Car', icon: 'car-sport' },
  { id: 'van', label: 'Van', icon: 'bus' },
];

const Field = ({ label, icon, children, focused }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldBox, focused && styles.fieldBoxFocused]}>
      <Icon name={icon} size={18} color={focused ? '#6C5CE7' : '#94A3B8'} />
      {children}
    </View>
  </View>
);

const RegisterDriverScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({});

  const focus = (k) => setF((p) => ({ ...p, [k]: true }));
  const blur = (k) => setF((p) => ({ ...p, [k]: false }));

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !vehicleNumber || !licenseNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Invalid email address');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      Alert.alert('Error', 'Enter a valid 10-digit phone number');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${AUTH_URL}/register-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          vehicleType,
          vehicleNumber,
          licenseNumber,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', `Rider ${name} registered successfully!`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Register Rider</Text>
            <Text style={styles.headerSub}>Add a new delivery rider</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Details */}
          <Text style={styles.sectionLabel}>Personal Details</Text>

          <Field label="Full Name" icon="person-outline" focused={f.name}>
            <TextInput
              style={styles.input}
              placeholder="Rider's full name"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
              onFocus={() => focus('name')}
              onBlur={() => blur('name')}
            />
          </Field>

          <Field label="Email Address" icon="mail-outline" focused={f.email}>
            <TextInput
              style={styles.input}
              placeholder="rider@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              onFocus={() => focus('email')}
              onBlur={() => blur('email')}
            />
          </Field>

          <Field label="Phone Number" icon="call-outline" focused={f.phone}>
            <TextInput
              style={styles.input}
              placeholder="10-digit phone number"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
              onFocus={() => focus('phone')}
              onBlur={() => blur('phone')}
            />
          </Field>

          <Field label="Password" icon="lock-closed-outline" focused={f.password}>
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              onFocus={() => focus('password')}
              onBlur={() => blur('password')}
            />
          </Field>

          {/* Vehicle Details */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Vehicle Details</Text>

          <Text style={styles.fieldLabel}>Vehicle Type</Text>
          <View style={styles.vehicleRow}>
            {VEHICLE_TYPES.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleChip, vehicleType === v.id && styles.vehicleChipActive]}
                onPress={() => setVehicleType(v.id)}
                disabled={loading}
              >
                <Icon
                  name={v.icon}
                  size={16}
                  color={vehicleType === v.id ? '#fff' : '#64748B'}
                />
                <Text
                  style={[
                    styles.vehicleChipText,
                    vehicleType === v.id && styles.vehicleChipTextActive,
                  ]}
                >
                  {v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Vehicle Number" icon="card-outline" focused={f.vehicleNumber}>
            <TextInput
              style={styles.input}
              placeholder="e.g. RJ14 AB 1234"
              placeholderTextColor="#94A3B8"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
              editable={!loading}
              onFocus={() => focus('vehicleNumber')}
              onBlur={() => blur('vehicleNumber')}
            />
          </Field>

          <Field label="License Number" icon="document-text-outline" focused={f.licenseNumber}>
            <TextInput
              style={styles.input}
              placeholder="e.g. RJ-1420200012345"
              placeholderTextColor="#94A3B8"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
              editable={!loading}
              onFocus={() => focus('licenseNumber')}
              onBlur={() => blur('licenseNumber')}
            />
          </Field>

          {/* Note */}
          <View style={styles.note}>
            <Icon name="information-circle" size={16} color="#6C5CE7" />
            <Text style={styles.noteText}>
              The rider will be able to log in immediately with these credentials.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="bicycle" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Register Rider</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 1 },

  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  fieldBoxFocused: { borderColor: '#6C5CE7' },
  input: { flex: 1, fontSize: 14, color: '#1E293B' },

  vehicleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    gap: 6,
  },
  vehicleChipActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  vehicleChipText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  vehicleChipTextActive: { color: '#fff' },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  noteText: { fontSize: 12, color: '#6C5CE7', lineHeight: 18, flex: 1 },

  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#6C5CE7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default RegisterDriverScreen;
