import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { signupUser, clearError } from '../../store/slices/authSlice';
import { setUserData } from '../../store/slices/userSlice';
import notificationService from '../../services/notificationService';

const ROLE_HOME_SCREEN = {
  admin:  'AdminHome',
  driver: 'DriverHome',
  user:   'MainApp',
};

// ─── Animated Input Field ─────────────────────────────────────────────────────
const InputField = ({ label, iconName, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, maxLength, editable, rightElement, labelColor, inputBg }) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () =>
    Animated.timing(borderAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(borderAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [inputBg || '#fff', '#4CAF50'],
  });

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, labelColor && { color: labelColor }]}>{label}</Text>
      <Animated.View style={[styles.inputBox, { borderColor, backgroundColor: inputBg || '#fff' }]}>
        <Icon name={iconName} size={16} color="#C7C7CC" style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#C7C7CC"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={editable !== false}
        />
        {rightElement}
      </Animated.View>
    </View>
  );
};

// ─── Role Card ────────────────────────────────────────────────────────────────
const RoleCard = ({ role, selected, onSelect, disabled }) => (
  <TouchableOpacity
    style={[styles.roleCard, selected && styles.roleCardSelected]}
    onPress={() => onSelect(role.id)}
    activeOpacity={0.8}
    disabled={disabled}
  >
    <View style={[styles.roleIconWrap, selected && styles.roleIconWrapSelected]}>
      <Icon name={role.icon} size={20} color={selected ? '#4CAF50' : '#8E8E93'} />
    </View>
    <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>{role.title}</Text>
    <Text style={[styles.roleDesc, selected && styles.roleDescSelected]}>{role.desc}</Text>
    <View style={[styles.roleDot, selected && styles.roleDotSelected]} />
  </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const SignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [selectedRole, setSelectedRole]               = useState('user');
  const [name, setName]                               = useState('');
  const [email, setEmail]                             = useState('');
  const [phone, setPhone]                             = useState('');
  const [password, setPassword]                       = useState('');
  const [confirmPassword, setConfirmPassword]         = useState('');
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Driver fields
  const [vehicleType, setVehicleType]     = useState('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Signup Failed', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const roles = [
    { id: 'user',   icon: 'shopping-cart', title: 'Customer',       desc: 'Shop & order groceries' },
    { id: 'driver', icon: 'truck',         title: 'Delivery Rider',  desc: 'Deliver & earn money'   },
  ];

  const vehicleTypes = [
    { id: 'bike',    label: 'Bike',    icon: 'wind'      },
    { id: 'scooter', label: 'Scooter', icon: 'wind'      },
    { id: 'car',     label: 'Car',     icon: 'navigation' },
    { id: 'van',     label: 'Van',     icon: 'truck'     },
  ];

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePhone = (val) => /^[0-9]{10}$/.test(val);

  const passwordValid   = password.length >= 6;
  const passwordsMatch  = password.length > 0 && password === confirmPassword;

  const handleSignup = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (name.trim().length < 3) {
      Alert.alert('Error', 'Name must be at least 3 characters');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (selectedRole === 'driver') {
      if (!vehicleNumber.trim()) {
        Alert.alert('Error', 'Please enter your vehicle number');
        return;
      }
      if (!licenseNumber.trim()) {
        Alert.alert('Error', 'Please enter your license number');
        return;
      }
    }

    try {
      const permissionGranted = await notificationService.requestPermission();
      let fcmToken = null;
      if (permissionGranted) {
        fcmToken = await notificationService.getToken();
      }

      const result = await dispatch(signupUser({
        name:          name.trim(),
        email:         email.trim().toLowerCase(),
        password,
        phone:         phone.trim(),
        role:          selectedRole,
        fcmToken,
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        licenseNumber: licenseNumber.trim().toUpperCase(),
      })).unwrap();

      if (result.user) dispatch(setUserData(result.user));

      const role       = result.user?.role ?? selectedRole;
      const homeScreen = ROLE_HOME_SCREEN[role] ?? 'MainApp';

      const successTitle = role === 'driver' ? 'Welcome, Rider!' : 'Welcome!';
      const successMsg   = role === 'driver'
        ? 'Driver account created! Go online to start accepting deliveries.'
        : 'Account created! Check your notifications for a special welcome offer!';

      Alert.alert(successTitle, successMsg, [
        { text: "Let's Go!", onPress: () => navigation.replace(homeScreen) },
      ]);
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Icon name="arrow-left" size={20} color="#000" />
            </TouchableOpacity>
            <View style={styles.heroCenter}>
              <View style={styles.logoWrap}>
                <Icon
                  name={selectedRole === 'driver' ? 'truck' : 'shopping-bag'}
                  size={26}
                  color="#fff"
                />
              </View>
              <Text style={styles.heroTitle}>Create account</Text>
              <Text style={styles.heroSub}>Choose how you want to join us</Text>
            </View>
          </View>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <View style={styles.body}>

            {/* Role selector */}
            <Text style={styles.sectionLabel}>I want to join as</Text>
            <View style={styles.roleRow}>
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  selected={selectedRole === role.id}
                  onSelect={setSelectedRole}
                  disabled={loading}
                />
              ))}
            </View>

            {/* Personal details */}
            <Text style={styles.sectionLabel}>Personal details</Text>

            <InputField
              label="Full name"
              iconName="user"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              editable={!loading}
            />
            <InputField
              label="Email address"
              iconName="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              editable={!loading}
            />
            <InputField
              label="Phone number"
              iconName="phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit phone number"
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
            />
            <InputField
              label="Password"
              iconName="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry={!showPassword}
              editable={!loading}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name={showPassword ? 'eye' : 'eye-off'} size={16} color="#C7C7CC" />
                </TouchableOpacity>
              }
            />
            <InputField
              label="Confirm password"
              iconName="lock"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name={showConfirmPassword ? 'eye' : 'eye-off'} size={16} color="#C7C7CC" />
                </TouchableOpacity>
              }
            />

            {/* Password hints */}
            <View style={styles.hintsBox}>
              <View style={styles.hintRow}>
                <View style={[styles.hintDot, passwordValid && styles.hintDotValid]} />
                <Text style={[styles.hintText, passwordValid && styles.hintTextValid]}>
                  At least 6 characters
                </Text>
              </View>
              <View style={styles.hintRow}>
                <View style={[styles.hintDot, passwordsMatch && styles.hintDotValid]} />
                <Text style={[styles.hintText, passwordsMatch && styles.hintTextValid]}>
                  Passwords match
                </Text>
              </View>
            </View>

            {/* Driver-only section */}
            {selectedRole === 'driver' && (
              <View style={styles.driverCard}>
                <View style={styles.driverHeader}>
                  <Icon name="truck" size={18} color="#2563EB" />
                  <View>
                    <Text style={styles.driverHeaderTitle}>Vehicle details</Text>
                    <Text style={styles.driverHeaderSub}>Required for delivery approval</Text>
                  </View>
                </View>

                {/* Vehicle type chips */}
                <View style={styles.vehicleChips}>
                  {vehicleTypes.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.vehicleChip, vehicleType === v.id && styles.vehicleChipSelected]}
                      onPress={() => setVehicleType(v.id)}
                      disabled={loading}
                      activeOpacity={0.75}
                    >
                      <Icon
                        name={v.icon}
                        size={13}
                        color={vehicleType === v.id ? '#fff' : '#2563EB'}
                      />
                      <Text style={[styles.vehicleChipText, vehicleType === v.id && styles.vehicleChipTextSelected]}>
                        {v.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <InputField
                  label="Vehicle number"
                  iconName="credit-card"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  placeholder="e.g. RJ14 AB 1234"
                  autoCapitalize="characters"
                  editable={!loading}
                  inputBg="#fff"
                  labelColor="#1E40AF"
                />
                <InputField
                  label="Driving license number"
                  iconName="file-text"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  placeholder="e.g. RJ-1420200012345"
                  autoCapitalize="characters"
                  editable={!loading}
                  inputBg="#fff"
                  labelColor="#1E40AF"
                />

                <View style={styles.driverNote}>
                  <Icon name="info" size={14} color="#1D4ED8" style={{ marginTop: 1 }} />
                  <Text style={styles.driverNoteText}>
                    Driver accounts require admin approval before you can start accepting deliveries.
                  </Text>
                </View>
              </View>
            )}

            {/* Terms */}
            <View style={styles.termsWrap}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms & Conditions</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Sign Up button */}
            <TouchableOpacity
              style={[styles.signUpBtn, loading && styles.signUpBtnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.signUpBtnText}>
                    {selectedRole === 'driver' ? 'Register as Rider' : 'Create Account'}
                  </Text>
                  <View style={styles.arrowChip}>
                    <Icon name="arrow-right" size={16} color="#fff" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* OR divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or continue with</Text>
              <View style={styles.orLine} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75} disabled={loading}>
                <MaterialCommunityIcons name="facebook" size={20} color="#1877F2" />
                <Text style={styles.socialBtnText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75} disabled={loading}>
                <MaterialCommunityIcons name="google" size={18} color="#EA4335" />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Sign in link */}
            <View style={styles.signinRow}>
              <Text style={styles.signinMuted}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                <Text style={styles.signinLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCenter: { alignItems: 'center' },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 4 },
  heroSub: { fontSize: 13, color: '#8E8E93' },

  // Body
  body: { paddingHorizontal: 16 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },

  // Role cards
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  roleCardSelected: { borderColor: '#4CAF50', backgroundColor: '#F0FDF4' },
  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleIconWrapSelected: { backgroundColor: '#E8F5E9' },
  roleTitle: { fontSize: 13, fontWeight: '700', color: '#000' },
  roleTitleSelected: { color: '#2E7D32' },
  roleDesc: { fontSize: 11, color: '#8E8E93', textAlign: 'center' },
  roleDescSelected: { color: '#4CAF50' },
  roleDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    backgroundColor: 'transparent',
  },
  roleDotSelected: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },

  // Input fields
  fieldWrapper: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
  },
  inputIcon: { marginRight: 8 },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 0,
  },

  // Password hints
  hintsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  hintDotValid: { backgroundColor: '#4CAF50' },
  hintText: { fontSize: 12, color: '#8E8E93' },
  hintTextValid: { color: '#4CAF50', fontWeight: '600' },

  // Driver card
  driverCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: 14,
    marginBottom: 14,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  driverHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF', marginBottom: 2 },
  driverHeaderSub: { fontSize: 11, color: '#3B82F6' },

  vehicleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  vehicleChipSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  vehicleChipText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  vehicleChipTextSelected: { color: '#fff' },

  driverNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  driverNoteText: { flex: 1, fontSize: 11, color: '#1D4ED8', lineHeight: 17 },

  // Terms
  termsWrap: { marginBottom: 16 },
  termsText: { fontSize: 12, color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  termsLink: { color: '#4CAF50', fontWeight: '600' },

  // Sign Up button
  signUpBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 22,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  signUpBtnDisabled: { opacity: 0.6 },
  signUpBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  arrowChip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // OR divider
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  orLine: { flex: 1, height: 0.5, backgroundColor: '#D1D1D6' },
  orText: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },

  // Social
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 46,
  },
  socialBtnText: { fontSize: 13, fontWeight: '600', color: '#000' },

  // Sign in link
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signinMuted: { fontSize: 14, color: '#8E8E93' },
  signinLink: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
});

export default SignupScreen;