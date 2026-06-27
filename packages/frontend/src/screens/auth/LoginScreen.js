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
import { loginUser, clearError } from '../../store/slices/authSlice';
import { setUserData } from '../../store/slices/userSlice';

const ADMIN_EMAIL    = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';

const ROLE_HOME_SCREEN = {
  admin:  'AdminHome',
  driver: 'DriverHome',
  user:   'MainApp',
};

// ─── Animated Input Field ─────────────────────────────────────────────────────
const InputField = ({ label, iconName, value, onChangeText, placeholder, secureTextEntry, keyboardType, editable, rightElement }) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () =>
    Animated.timing(borderAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(borderAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', '#4CAF50'],
  });

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.inputBox, { borderColor }]}>
        <Icon name={iconName} size={17} color="#C7C7CC" style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#C7C7CC"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={editable !== false}
        />
        {rightElement}
      </Animated.View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleAdminQuickFill = () => {
    setEmail(ADMIN_EMAIL);
    setPassword(ADMIN_PASSWORD);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      if (result.user) dispatch(setUserData(result.user));

      const role       = result.user?.role ?? 'user';
      const homeScreen = ROLE_HOME_SCREEN[role] ?? 'MainApp';
      const userName   = result.user?.name ?? 'User';

      Alert.alert('Welcome back!', `Signed in as ${userName}`, [
        { text: "Let's Go!", onPress: () => navigation.replace(homeScreen) },
      ]);
    } catch (err) {
      console.error('Login error:', err);
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
            <View style={styles.logoWrap}>
              <Icon name="shopping-bag" size={28} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Welcome back</Text>
            <Text style={styles.heroSub}>Sign in to continue shopping</Text>
          </View>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <View style={styles.body}>

            {/* Admin quick fill */}
            <TouchableOpacity
              style={styles.adminPill}
              onPress={handleAdminQuickFill}
              activeOpacity={0.75}
              disabled={loading}
            >
              <View style={styles.adminLeft}>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
                <View>
                  <Text style={styles.adminTitle}>Quick Admin Login</Text>
                  <Text style={styles.adminEmail}>{ADMIN_EMAIL}</Text>
                </View>
              </View>
              <View style={styles.adminBtn}>
                <Text style={styles.adminBtnText}>Fill</Text>
                <Icon name="arrow-right" size={13} color="#8E8E93" />
              </View>
            </TouchableOpacity>

            {/* Email */}
            <InputField
              label="Email address"
              iconName="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              editable={!loading}
              rightElement={
                email.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setEmail('')}
                    disabled={loading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="x" size={15} color="#C7C7CC" />
                  </TouchableOpacity>
                ) : null
              }
            />

            {/* Password */}
            <InputField
              label="Password"
              iconName="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              editable={!loading}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name={showPassword ? 'eye' : 'eye-off'} size={17} color="#C7C7CC" />
                </TouchableOpacity>
              }
            />

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotWrap}
              disabled={loading}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.signInText}>Sign In</Text>
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

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupMuted}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading}>
                <Text style={styles.signupLink}>Sign Up</Text>
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
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Body
  body: { paddingHorizontal: 16 },

  // Admin pill
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  adminLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adminBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  adminBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },
  adminTitle: { fontSize: 12, fontWeight: '700', color: '#fff', marginBottom: 2 },
  adminEmail: { fontSize: 11, color: '#636366' },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  adminBtnText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },

  // Input fields
  fieldWrapper: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  inputIcon: { marginRight: 8 },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    paddingVertical: 0,
  },

  // Forgot
  forgotWrap: { alignSelf: 'flex-end', marginTop: 6, marginBottom: 20 },
  forgotText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },

  // Sign In button
  signInBtn: {
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
  signInBtnDisabled: { opacity: 0.6 },
  signInText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
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

  // Sign up
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupMuted: { fontSize: 14, color: '#8E8E93' },
  signupLink: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
});

export default LoginScreen;