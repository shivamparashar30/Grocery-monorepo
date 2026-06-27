import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';

const VEHICLE_TYPES = [
  { id: 'bike',    label: '🏍️ Bike'    },
  { id: 'scooter', label: '🛵 Scooter'  },
  { id: 'car',     label: '🚗 Car'      },
  { id: 'van',     label: '🚐 Van'      },
];

const Field = ({ label, icon, focused, onFocus, onBlur, children }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldBox, focused && styles.fieldBoxFocused]}>
      <Text style={styles.fieldIcon}>{icon}</Text>
      {children}
    </View>
  </View>
);

const RegisterDriverScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [phone,         setPhone]         = useState('');
  const [password,      setPassword]      = useState('');
  const [vehicleType,   setVehicleType]   = useState('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading,       setLoading]       = useState(false);

  // Focus states
  const [f, setF] = useState({});
  const focus  = (k) => setF((p) => ({ ...p, [k]: true  }));
  const blur   = (k) => setF((p) => ({ ...p, [k]: false }));

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
      // TODO: dispatch(registerDriver({ name, email, phone, password, vehicleType, vehicleNumber, licenseNumber }))
      await new Promise((r) => setTimeout(r, 1200)); // mock delay
      Alert.alert('Success 🎉', `Driver ${name} registered successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Register Driver</Text>
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

          <Field label="Full Name" icon="👤" focused={f.name}>
            <TextInput
              style={styles.input} placeholder="Driver's full name"
              value={name} onChangeText={setName}
              autoCapitalize="words" editable={!loading}
              onFocus={() => focus('name')} onBlur={() => blur('name')}
            />
          </Field>

          <Field label="Email Address" icon="✉️" focused={f.email}>
            <TextInput
              style={styles.input} placeholder="driver@example.com"
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" editable={!loading}
              onFocus={() => focus('email')} onBlur={() => blur('email')}
            />
          </Field>

          <Field label="Phone Number" icon="📱" focused={f.phone}>
            <TextInput
              style={styles.input} placeholder="10-digit phone number"
              value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" maxLength={10} editable={!loading}
              onFocus={() => focus('phone')} onBlur={() => blur('phone')}
            />
          </Field>

          <Field label="Password" icon="🔒" focused={f.password}>
            <TextInput
              style={styles.input} placeholder="Minimum 6 characters"
              value={password} onChangeText={setPassword}
              secureTextEntry editable={!loading}
              onFocus={() => focus('password')} onBlur={() => blur('password')}
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
                <Text style={[styles.vehicleChipText, vehicleType === v.id && styles.vehicleChipTextActive]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Vehicle Number" icon="🔢" focused={f.vehicleNumber}>
            <TextInput
              style={styles.input} placeholder="e.g. RJ14 AB 1234"
              value={vehicleNumber} onChangeText={setVehicleNumber}
              autoCapitalize="characters" editable={!loading}
              onFocus={() => focus('vehicleNumber')} onBlur={() => blur('vehicleNumber')}
            />
          </Field>

          <Field label="License Number" icon="📋" focused={f.licenseNumber}>
            <TextInput
              style={styles.input} placeholder="e.g. RJ-1420200012345"
              value={licenseNumber} onChangeText={setLicenseNumber}
              autoCapitalize="characters" editable={!loading}
              onFocus={() => focus('licenseNumber')} onBlur={() => blur('licenseNumber')}
            />
          </Field>

          {/* Note */}
          <View style={styles.note}>
            <Text style={styles.noteText}>
              ℹ️ The driver will be created and can immediately log in with these credentials.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>🚗 Register Driver</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1a1a2e', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ffffff18', justifyContent: 'center', alignItems: 'center',
  },
  backIcon:    { color: '#fff', fontSize: 20, lineHeight: 22 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:   { color: '#94a3b8', fontSize: 12 },
  scroll:      { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  fieldWrap:  { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  fieldBoxFocused: { borderColor: '#6366f1' },
  fieldIcon: { fontSize: 18, marginRight: 10 },
  input:     { flex: 1, fontSize: 14, color: '#1e293b' },
  vehicleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  vehicleChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff',
  },
  vehicleChipActive:    { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  vehicleChipText:      { fontSize: 13, color: '#334155', fontWeight: '600' },
  vehicleChipTextActive:{ color: '#fff' },
  note: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginBottom: 16 },
  noteText: { fontSize: 12, color: '#1d4ed8', lineHeight: 18 },
  submitBtn: {
    backgroundColor: '#e94560', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#e94560', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default RegisterDriverScreen;
