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
  Dimensions,
  Image,
  Easing,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { setUserData } from '../../store/slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../../services/notificationService';
import { authService } from '../../services/authService';
import LoginSuccessOverlay from '../../components/LoginSuccessOverlay';

const { width } = Dimensions.get('window');

const ADMIN_EMAIL    = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';

const ROLE_HOME_SCREEN = {
  admin:  'AdminHome',
  driver: 'DriverHome',
  user:   'MainApp',
};

// Floating grocery items for background decoration
const FLOATING_ITEMS = [
  { emoji: '🥦', size: 28, left: '8%',  top: 30,  delay: 0 },
  { emoji: '🍎', size: 22, left: '82%', top: 50,  delay: 200 },
  { emoji: '🥕', size: 24, left: '70%', top: 15,  delay: 400 },
  { emoji: '🍞', size: 20, left: '20%', top: 8,   delay: 600 },
  { emoji: '🧀', size: 18, left: '55%', top: 45,  delay: 300 },
  { emoji: '🥬', size: 26, left: '90%', top: 25,  delay: 500 },
  { emoji: '🍋', size: 20, left: '40%', top: 5,   delay: 100 },
];

const FloatingItem = ({ emoji, size, left, top, delay }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: delay + 400,
      useNativeDriver: true,
    }).start();

    // Continuous float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2400 + Math.random() * 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2400 + Math.random() * 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left,
        top,
        fontSize: size,
        opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
        transform: [{ translateY }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
};

// Animated Input Field
const InputField = ({ label, iconName, value, onChangeText, placeholder, secureTextEntry, keyboardType, editable, rightElement }) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () =>
    Animated.timing(borderAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(borderAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E8E8ED', '#4CAF50'],
  });

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.inputBox, { borderColor }]}>
        <Icon name={iconName} size={17} color="#9E9EA6" style={styles.inputIcon} />
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

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [successName, setSuccessName]   = useState('');
  const [pendingNav, setPendingNav]     = useState(null);

  // Animation values
  const logoScale     = useRef(new Animated.Value(0)).current;
  const logoRotate    = useRef(new Animated.Value(0)).current;
  const glowPulse     = useRef(new Animated.Value(0)).current;
  const titleFade     = useRef(new Animated.Value(0)).current;
  const titleSlide    = useRef(new Animated.Value(20)).current;
  const subtitleFade  = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(15)).current;
  const formFade      = useRef(new Animated.Value(0)).current;
  const formSlide     = useRef(new Animated.Value(40)).current;
  const waveFade      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation sequence
    Animated.sequence([
      // 1. Logo bounces in with spring
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // 2. Title slides in
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // 3. Subtitle
      Animated.parallel([
        Animated.timing(subtitleFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(subtitleSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // 4. Form slides up
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.timing(waveFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Continuous glow pulse on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
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

      try {
        const fcmToken = await notificationService.getToken();
        if (fcmToken && result.token) {
          await authService.updateFCMToken(result.token, fcmToken);
        }
      } catch (fcmErr) {
        console.warn('FCM sync after login failed:', fcmErr.message);
      }

      const role       = result.user?.role ?? 'user';
      const homeScreen = ROLE_HOME_SCREEN[role] ?? 'MainApp';
      const userName   = result.user?.name ?? 'User';

      setSuccessName(userName);
      setPendingNav(homeScreen);
      setShowSuccess(true);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <View style={styles.root}>
      <LoginSuccessOverlay
        visible={showSuccess}
        userName={successName}
        onFinish={() => {
          setShowSuccess(false);
          if (pendingNav) navigation.replace(pendingNav);
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section with Animated Logo ─────────────────────── */}
        <View style={styles.hero}>
          {/* Floating grocery items */}
          {FLOATING_ITEMS.map((item, i) => (
            <FloatingItem key={i} {...item} />
          ))}

          {/* Glow ring behind logo */}
          <Animated.View style={[styles.glowRing, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />

          {/* Logo with bounce + rotation */}
          <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }, { rotate: spin }] }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Title */}
          <Animated.Text style={[styles.heroTitle, { opacity: titleFade, transform: [{ translateY: titleSlide }] }]}>
            Welcome back
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.heroSub, { opacity: subtitleFade, transform: [{ translateY: subtitleSlide }] }]}>
            Sign in to continue shopping
          </Animated.Text>

          {/* Decorative wave dots */}
          <Animated.View style={[styles.waveRow, { opacity: waveFade }]}>
            {[0,1,2,3,4].map(i => (
              <View key={i} style={[styles.waveDot, i === 2 && styles.waveDotActive]} />
            ))}
          </Animated.View>
        </View>

        {/* ── Form Section ────────────────────────────────────────── */}
        <Animated.View style={[styles.body, { opacity: formFade, transform: [{ translateY: formSlide }] }]}>

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

        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  flex1: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },

  // Glow ring
  glowRing: {
    position: 'absolute',
    top: 36,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
  },

  // Logo
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoImage: {
    width: 88,
    height: 88,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 16,
  },

  // Wave dots
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  waveDotActive: {
    width: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
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
    borderColor: '#E8E8ED',
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
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  socialBtnText: { fontSize: 13, fontWeight: '600', color: '#000' },

  // Sign up
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupMuted: { fontSize: 14, color: '#8E8E93' },
  signupLink: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
});

export default LoginScreen;
