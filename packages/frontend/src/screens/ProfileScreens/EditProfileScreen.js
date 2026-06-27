import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { fetchUserProfile, updateUserProfile, clearUpdateSuccess } from '../../store/slices/userSlice';

// ─── Animated Input Field (used inside edit modal) ────────────────────────────
const InputField = ({ label, iconName, value, onChangeText, placeholder, keyboardType, autoCapitalize, editable }) => {
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
        <Icon name={iconName} size={16} color="#C7C7CC" style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#C7C7CC"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={editable !== false}
        />
      </Animated.View>
    </View>
  );
};

// ─── Field Row (tappable info row in the card) ────────────────────────────────
const FieldRow = ({ iconName, label, value, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.fieldRow, !isLast && styles.fieldRowBorder]}
    onPress={onPress}
    activeOpacity={0.65}
  >
    <View style={styles.fieldIconWrap}>
      <Icon name={iconName} size={16} color="#4CAF50" />
    </View>
    <View style={styles.fieldContent}>
      <Text style={styles.fieldRowLabel}>{label}</Text>
      <Text style={[styles.fieldRowValue, !value && styles.fieldRowPlaceholder]}>
        {value || 'Not set'}
      </Text>
    </View>
    <Icon name="chevron-right" size={16} color="#C7C7CC" />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: userData, loading, updating, updateSuccess, error } =
    useSelector((state) => state.user);

  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible]   = useState(false);
  const [editingField, setEditingField]   = useState(null); // 'name' | 'email' | 'phone'
  const [modalValue, setModalValue]       = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  // Load from AsyncStorage first, then Redux
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setName(user.name   || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
          setIsDataLoaded(true);
        }
        dispatch(fetchUserProfile());
      } catch (err) {
        console.error('EditProfile: Error loading user data:', err);
      }
    };
    loadUserData();
  }, [dispatch]);

  // Sync Redux data into form
  useEffect(() => {
    if (userData) {
      setName(userData.name   || '');
      setEmail(userData.email || '');
      setPhone(userData.phone || '');
      setIsDataLoaded(true);
    }
  }, [userData]);

  // Handle save success
  useEffect(() => {
    if (updateSuccess) {
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: async () => {
            await dispatch(fetchUserProfile());
            dispatch(clearUpdateSuccess());
            navigation.goBack();
          },
        },
      ]);
    }
  }, [updateSuccess, dispatch, navigation]);

  // Handle errors
  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  const getInitials = (n) => {
    if (!n) return 'U';
    return n.split(' ').map((w) => w[0]).join('').toUpperCase().substring(0, 2);
  };

  // Open modal for a specific field
  const openEdit = (field) => {
    setEditingField(field);
    setModalValue(field === 'name' ? name : field === 'email' ? email : phone);
    setModalVisible(true);
  };

  // Confirm edit from modal
  const confirmEdit = () => {
    if (editingField === 'name')  setName(modalValue);
    if (editingField === 'email') setEmail(modalValue);
    if (editingField === 'phone') setPhone(modalValue);
    setModalVisible(false);
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Photo', 'Choose an option', [
      { text: 'Take Photo',           onPress: () => {} },
      { text: 'Choose from Gallery',  onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number (at least 10 digits)');
      return;
    }

    const result = await dispatch(updateUserProfile({ name, email, phone }));

    if (result.type === 'user/updateProfile/fulfilled') {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          await AsyncStorage.setItem('user', JSON.stringify({ ...user, name, email, phone }));
        }
      } catch (err) {
        console.error('EditProfile: AsyncStorage update error:', err);
      }
    }
  };

  const modalFieldConfig = {
    name:  { label: 'Full name',      icon: 'user',  keyboard: 'default',       capitalize: 'words' },
    email: { label: 'Email address',  icon: 'mail',  keyboard: 'email-address', capitalize: 'none'  },
    phone: { label: 'Phone number',   icon: 'phone', keyboard: 'phone-pad',     capitalize: 'none'  },
  };

  // Loading state (first load only)
  if (loading && !isDataLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            disabled={updating}
          >
            <Icon name="arrow-left" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Avatar section ──────────────────────────────────────── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={handleChangePhoto}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              </View>
              <View style={styles.cameraChip}>
                <Icon name="camera" size={13} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarName}>{name || 'Your Name'}</Text>
            <Text style={styles.avatarSub}>Tap avatar to change photo</Text>
          </View>

          {/* ── Stats row ───────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{userData?.orderCount ?? 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>₹{userData?.totalSavings ?? 0}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statVal, styles.statValDark]}>
                {userData?.membershipTier || 'Gold'}
              </Text>
              <Text style={styles.statLabel}>Member</Text>
            </View>
          </View>

          {/* ── Fields card ─────────────────────────────────────────── */}
          <View style={styles.body}>
            <Text style={styles.sectionLabel}>Personal information</Text>
            <View style={styles.fieldsCard}>
              <FieldRow
                iconName="user"
                label="Full name"
                value={name}
                onPress={() => openEdit('name')}
              />
              <FieldRow
                iconName="mail"
                label="Email address"
                value={email}
                onPress={() => openEdit('email')}
              />
              <FieldRow
                iconName="phone"
                label="Phone number"
                value={phone}
                onPress={() => openEdit('phone')}
                isLast
              />
            </View>

            {/* Info card */}
            <View style={styles.infoCard}>
              <Icon name="info" size={15} color="#2563EB" style={{ marginTop: 1 }} />
              <Text style={styles.infoText}>
                Your email and phone are used for account verification and order updates.
              </Text>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Save button ─────────────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={styles.saveSafe}>
        <TouchableOpacity
          style={[styles.saveBtn, updating && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={updating}
          activeOpacity={0.82}
        >
          {updating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.saveBtnText}>Save changes</Text>
              <View style={styles.arrowChip}>
                <Icon name="arrow-right" size={16} color="#fff" />
              </View>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Edit field modal ─────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            {/* Modal handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editingField && modalFieldConfig[editingField]?.label}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="x" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {editingField && (
              <InputField
                label={modalFieldConfig[editingField].label}
                iconName={modalFieldConfig[editingField].icon}
                value={modalValue}
                onChangeText={setModalValue}
                placeholder={`Enter your ${modalFieldConfig[editingField].label.toLowerCase()}`}
                keyboardType={modalFieldConfig[editingField].keyboard}
                autoCapitalize={modalFieldConfig[editingField].capitalize}
              />
            )}

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={confirmEdit}
              activeOpacity={0.82}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },

  // Loading
  loadingContainer: { flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#8E8E93' },

  // Header
  headerSafe: { backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  // Avatar section
  avatarSection: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 22,
    marginBottom: 16,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E8F5E9',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  cameraChip: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarName: { fontSize: 17, fontWeight: '700', color: '#000', marginBottom: 4 },
  avatarSub: { fontSize: 12, color: '#8E8E93' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  statVal: { fontSize: 18, fontWeight: '700', color: '#4CAF50' },
  statValDark: { fontSize: 15, color: '#000' },
  statLabel: { fontSize: 11, color: '#8E8E93' },

  // Body
  body: { paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Fields card
  fieldsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  fieldRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  fieldIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  fieldContent: { flex: 1 },
  fieldRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  fieldRowValue: { fontSize: 14, fontWeight: '500', color: '#000' },
  fieldRowPlaceholder: { color: '#C7C7CC', fontWeight: '400' },

  // Info card
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  infoText: { flex: 1, fontSize: 12, color: '#1D4ED8', lineHeight: 18 },

  // Save bar
  saveSafe: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#E5E5EA' },
  saveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    margin: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  arrowChip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#000' },

  // Modal input field
  fieldWrapper: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 7,
    letterSpacing: 0.1,
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
  textInput: { flex: 1, fontSize: 15, color: '#000', paddingVertical: 0 },

  // Modal confirm button
  modalConfirmBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default EditProfileScreen;