import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserProfile, clearUserData } from '../store/slices/userSlice';
import { logoutUser } from '../store/slices/authSlice';
import { useWishlist } from '../context/WishlistContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const getMemberSince = (createdAt) => {
  if (!createdAt) return 'Recently';
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ value, label, accent }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SectionLabel = ({ title }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);


const MenuItem = ({ icon, iconLib = 'Feather', label, subtitle, onPress, rightElement }) => {
  const IconComponent =
    iconLib === 'MaterialCommunity' ? MaterialCommunityIcons
    : iconLib === 'Ionicons' ? Icon
    : Feather;

  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIcon}>
        <IconComponent name={icon} size={17} color="#555" />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      {rightElement ?? (
        <Feather name="chevron-right" size={17} color="#C8CDD4" />
      )}
    </TouchableOpacity>
  );
};

const MenuCard = ({ children }) => (
  <View style={styles.menuCard}>{children}</View>
);

const Divider = () => <View style={styles.divider} />;

const hasAvatar = (avatar) => {
  if (!avatar) return false;
  if (typeof avatar !== 'string') return false;
  if (avatar.trim() === '') return false;
  if (avatar === 'no-photo.png') return false;  // ← backend default placeholder
  return true;
};

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { wishlistCount } = useWishlist();
  const { data: userData, loading } = useSelector((state) => state.user);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [displayData, setDisplayData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) setDisplayData(JSON.parse(storedUser));
        if (isAuthenticated) dispatch(fetchUserProfile());
      } catch (error) {
        console.error('ProfileScreen: Error loading data:', error);
      }
    };
    loadData();
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (userData) setDisplayData(userData);
  }, [userData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) setDisplayData(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error refreshing from AsyncStorage:', error);
      }
      if (isAuthenticated) dispatch(fetchUserProfile());
    });
    return unsubscribe;
  }, [navigation, dispatch, isAuthenticated]);

  const handleLogoutConfirmed = async () => {
    try {
      setLoggingOut(true);
      dispatch(clearUserData());
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: handleLogoutConfirmed },
      ],
      { cancelable: true }
    );
  };

  const currentData = displayData || userData;

  if (loading && !currentData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const toggleSwitch = (setter) => (val) => setter(val);
  

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.75}
          >
            <Feather name="settings" size={19} color="#111" />
          </TouchableOpacity>
        </View>

        {/* ── Avatar Card ── */}
        <View style={styles.avatarCard}>
          {hasAvatar(currentData?.avatar) ? (
            <Image source={{ uri: currentData.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(currentData?.name)}</Text>
            </View>
          )}

          <View style={styles.avatarInfo}>
            <Text style={styles.userName}>{currentData?.name || 'User'}</Text>
            <View style={styles.metaRow}>
              <Feather name="mail" size={11} color="#A0AAB4" />
              <Text style={styles.metaText}>{currentData?.email || 'No email'}</Text>
            </View>
            {currentData?.phone && (
              <View style={styles.metaRow}>
                <Feather name="phone" size={11} color="#A0AAB4" />
                <Text style={styles.metaText}>{currentData.phone}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.editPill}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.75}
          >
            <Feather name="edit-2" size={12} color="#111" />
            <Text style={styles.editPillText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard value={currentData?.orderCount ?? 0} label="Orders" accent />
          <StatCard value={`₹${currentData?.totalSavings ?? 0}`} label="Saved" accent />
          <StatCard value={currentData?.membershipTier || 'Gold'} label="Member" />
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <SectionLabel title="Account" />
          <MenuCard>
            <MenuItem
              icon="user"
              label="Edit Profile"
              subtitle="Name, email & phone"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <Divider />
            <MenuItem
              icon="map-pin"
              label="My Addresses"
              subtitle="Saved locations"
              onPress={() => navigation.navigate('MyAddresses')}
              rightElement={
                <View style={styles.rowRight}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>3</Text>
                  </View>
                  <Feather name="chevron-right" size={17} color="#C8CDD4" />
                </View>
              }
            />
            <Divider />
            <MenuItem
              icon="credit-card"
              label="Payment Methods"
              subtitle="Cards & UPI"
              onPress={() => navigation.navigate('PaymentMethods')}
            />
            <Divider />
            <MenuItem
              icon="heart"
              iconLib="Ionicons"
              label="My Wishlist"
              subtitle="Saved products"
              onPress={() => navigation.navigate('Wishlist')}
              rightElement={
                wishlistCount > 0 ? (
                  <View style={styles.rowRight}>
                    <View style={[styles.countBadge, { backgroundColor: '#E53935' }]}>
                      <Text style={styles.countBadgeText}>{wishlistCount}</Text>
                    </View>
                    <Feather name="chevron-right" size={17} color="#C8CDD4" />
                  </View>
                ) : undefined
              }
            />
            <Divider />
            <MenuItem
              icon="clock"
              label="Order History"
              subtitle="Past orders & tracking"
              onPress={() => navigation.navigate('OrderHistory')}
            />
          </MenuCard>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <SectionLabel title="Preferences" />
          <MenuCard>
            <MenuItem
              icon="bell"
              label="Notifications"
              subtitle="Order updates & offers"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleSwitch(setNotificationsEnabled)}
                  trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#E0E0E0"
                />
              }
            />
            <Divider />
            <MenuItem
              icon="navigation"
              label="Location Services"
              subtitle="For faster delivery"
              rightElement={
                <Switch
                  value={locationEnabled}
                  onValueChange={toggleSwitch(setLocationEnabled)}
                  trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#E0E0E0"
                />
              }
            />
            <Divider />
            <MenuItem
              icon="globe"
              label="Language"
              subtitle="English"
              onPress={() => navigation.navigate('Language')}
            />
          </MenuCard>
        </View>

        {/* ── Support ── */}
        <View style={styles.section}>
          <SectionLabel title="Support" />
          <MenuCard>
            <MenuItem
              icon="help-circle"
              label="Help Center"
              onPress={() => navigation.navigate('HelpCenter')}
            />
            <Divider />
            <MenuItem
              icon="info"
              label="About Us"
              onPress={() => navigation.navigate('About')}
            />
            <Divider />
            <MenuItem
              icon="file-text"
              label="Terms & Conditions"
              onPress={() => navigation.navigate('Terms')}
            />
            <Divider />
            <MenuItem
              icon="shield"
              label="Privacy Policy"
              onPress={() => navigation.navigate('Privacy')}
            />
          </MenuCard>
        </View>

        {/* ── Membership Card ── */}
        <View style={styles.memberCard}>
          <View style={styles.crownWrap}>
            <MaterialCommunityIcons name="crown-outline" size={22} color="#C9A84C" />
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberTier}>
              {currentData?.membershipTier || 'Gold'} Member
            </Text>
            <Text style={styles.memberTitle}>
              Since {getMemberSince(currentData?.createdAt)}
            </Text>
            <Text style={styles.memberSub}>Exclusive benefits & rewards</Text>
          </View>
        </View>

        {/* ── Version ── */}
        <Text style={styles.version}>Version 1.0.0 · Made with ♥ in India</Text>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && { opacity: 0.5 }]}
          onPress={handleLogout}
          activeOpacity={0.75}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <>
              <ActivityIndicator size="small" color="#E53935" />
              <Text style={styles.logoutText}>Logging out...</Text>
            </>
          ) : (
            <>
              <Feather name="log-out" size={17} color="#E53935" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0EF',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F2F0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#A0AAB4',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar Card
  avatarCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  avatarInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#A0AAB4',
    fontWeight: '500',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F2F0EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexShrink: 0,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.8,
    lineHeight: 26,
  },
  statValueAccent: {
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 11,
    color: '#A0AAB4',
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 0.3,
  },

  // Sections
  section: {
    marginTop: 22,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B0B8C1',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingLeft: 2,
  },

  // Menu
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 13,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.1,
  },
  menuSub: {
    fontSize: 11,
    color: '#A0AAB4',
    fontWeight: '500',
    marginTop: 1,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#F4F4F4',
    marginLeft: 65,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },

  // Membership
  memberCard: {
    marginHorizontal: 20,
    marginTop: 22,
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  crownWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  memberInfo: {
    flex: 1,
    gap: 3,
  },
  memberTier: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C9A84C',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  memberTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
  },
  memberSub: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },

  // Version
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#C5CAD0',
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 4,
  },

  // Logout
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFE8E8',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E53935',
    letterSpacing: -0.1,
  },
});

export default ProfileScreen;