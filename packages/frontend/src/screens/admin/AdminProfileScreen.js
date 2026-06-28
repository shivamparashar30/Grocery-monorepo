import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { clearUserData } from '../../store/slices/userSlice';
import Icon from 'react-native-vector-icons/Ionicons';

const MenuItem = ({ icon, label, sub, onPress, color = '#1E293B', danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: danger ? '#FEE2E2' : '#F1F5F9' }]}>
      <Icon name={icon} size={18} color={danger ? '#DC2626' : color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && { color: '#DC2626' }]}>{label}</Text>
      {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
    </View>
    <Icon name="chevron-forward" size={16} color="#CBD5E1" />
  </TouchableOpacity>
);

const AdminProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: user } = useSelector((s) => s.user);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logoutUser());
          dispatch(clearUserData());
        },
      },
    ]);
  };

  const initials = (user?.name || 'A')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.adminChip}>
              <Text style={styles.adminChipText}>ADMIN</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'admin@grocery.com'}</Text>
        </View>

        {/* Management */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Management</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="layers-outline"
              label="Home Sections"
              sub="Manage app home screen"
              onPress={() => navigation.navigate('AdminSections')}
            />
            <MenuItem
              icon="people-outline"
              label="Customers"
              sub="View & manage users"
              onPress={() => navigation.navigate('AdminUsers')}
            />
            <MenuItem
              icon="bar-chart-outline"
              label="Analytics"
              sub="Revenue & insights"
              onPress={() => navigation.navigate('AdminAnalytics')}
            />
            <MenuItem
              icon="person-add-outline"
              label="Register Rider"
              sub="Add new delivery rider"
              onPress={() => navigation.navigate('RegisterDriver')}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>App</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="information-circle-outline"
              label="App Version"
              sub="1.0.0"
              color="#6C5CE7"
            />
            <MenuItem
              icon="server-outline"
              label="API Status"
              sub="Connected"
              color="#22C55E"
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.menuSection}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Logout"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#6C5CE7' },
  adminChip: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminChipText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  userEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },

  // Menu
  menuSection: { paddingHorizontal: 20, marginTop: 20 },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  menuSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
});

export default AdminProfileScreen;
