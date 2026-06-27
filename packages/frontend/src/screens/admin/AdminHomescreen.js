// screens/admin/AdminHomescreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { clearUserData } from '../../store/slices/userSlice';
import { fetchAllDrivers } from '../../store/slices/driversSlice';

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── QuickAction ──────────────────────────────────────────────────────────────
const QuickAction = ({ icon, label, onPress, color }) => (
  <TouchableOpacity
    style={[styles.quickAction, { backgroundColor: color + '15' }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Text style={styles.quickActionEmoji}>{icon}</Text>
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
const AdminHomescreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: user }       = useSelector((state) => state.user);
  const { all: allDrivers }  = useSelector((state) => state.drivers);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch drivers on mount so the stat card shows a live count
  useEffect(() => {
    dispatch(fetchAllDrivers());
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(clearUserData());
  };

  // ── Live driver counts derived from Redux state ──
  const onlineDriverCount  = allDrivers.filter((d) => d.isAvailable && !d.isBlocked).length;
  const totalDriverCount   = allDrivers.length;

  // ── Stats — "Active Drivers" is now live ──────────────────────────────────
  const stats = [
    { icon: '👥', label: 'Total Users',    value: '1,284',           color: '#4CAF50' },
    {
      icon: '🚗',
      label: 'Active Drivers',
      value: allDrivers.length > 0
        ? `${onlineDriverCount}/${totalDriverCount}`
        : '—',
      color: '#2196F3',
      onPress: () => navigation.navigate('AdminDrivers'),
    },
    { icon: '📦', label: 'Orders Today',   value: '319',             color: '#FF9800' },
    { icon: '💰', label: 'Revenue',        value: '₹84K',            color: '#9C27B0' },
  ];

  const quickActions = [
    { icon: '➕', label: 'Add Driver',  color: '#4CAF50', onPress: () => navigation.navigate('RegisterDriver') },
    { icon: '📋', label: 'All Orders',  color: '#2196F3', onPress: () => navigation.navigate('AdminOrders') },
    { icon: '👤', label: 'Users',       color: '#FF9800', onPress: () => navigation.navigate('AdminUsers') },
    { icon: '🚚', label: 'Drivers',     color: '#9C27B0', onPress: () => navigation.navigate('AdminDrivers') },
    { icon: '🏪', label: 'Products',    color: '#F44336', onPress: () => navigation.navigate('AdminProducts') },
    { icon: '📊', label: 'Analytics',   color: '#00BCD4', onPress: () => navigation.navigate('AdminAnalytics') },
  ];

  const recentActivity = [
    { id: 1, icon: '🆕', text: 'New user registered: Priya Sharma',   time: '2 min ago',  color: '#4CAF50' },
    { id: 2, icon: '🚗', text: 'Driver Rahul went online',             time: '5 min ago',  color: '#2196F3' },
    { id: 3, icon: '📦', text: 'Order #4821 delivered successfully',   time: '12 min ago', color: '#FF9800' },
    { id: 4, icon: '⚠️', text: 'Order #4818 delivery delayed',         time: '18 min ago', color: '#F44336' },
    { id: 5, icon: '💰', text: 'Payment received ₹1,240',              time: '25 min ago', color: '#9C27B0' },
  ];

  // ── Bottom nav tab press ──────────────────────────────────────────────────
  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'drivers') navigation.navigate('AdminDrivers');
    if (tabId === 'orders')  navigation.navigate('AdminOrders');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.adminName}>{user?.name || 'Administrator'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Driver status banner (shown when drivers are loaded) ── */}
        {allDrivers.length > 0 && (
          <TouchableOpacity
            style={styles.driverBanner}
            onPress={() => navigation.navigate('AdminDrivers')}
            activeOpacity={0.8}
          >
            <View style={styles.driverBannerLeft}>
              <Text style={styles.driverBannerTitle}>🟢 Live Driver Status</Text>
              <Text style={styles.driverBannerSub}>
                {onlineDriverCount} online · {totalDriverCount - onlineDriverCount} offline
                {allDrivers.filter((d) => d.isBlocked).length > 0
                  ? ` · ${allDrivers.filter((d) => d.isBlocked).length} blocked`
                  : ''}
              </Text>
            </View>
            <View style={styles.driverBannerRight}>
              <Text style={styles.driverBannerCta}>Manage →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Stats Row ── */}
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </ScrollView>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((a, i) => (
            <QuickAction key={i} {...a} />
          ))}
        </View>

        {/* ── Recent Activity ── */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {recentActivity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: item.color }]}>
                <Text style={styles.activityDotIcon}>{item.icon}</Text>
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityDescription}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        {[
          { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
          { id: 'orders',    icon: '📦', label: 'Orders'    },
          { id: 'drivers',   icon: '🚗', label: 'Drivers'   },
          { id: 'settings',  icon: '⚙️', label: 'Settings'  },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navTab}
            onPress={() => handleTabPress(tab.id)}
          >
            <View>
              <Text style={[styles.navIcon, activeTab === tab.id && styles.navIconActive]}>
                {tab.icon}
              </Text>
              {/* Live indicator dot on Drivers tab */}
              {tab.id === 'drivers' && onlineDriverCount > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{onlineDriverCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },

  // Header
  header: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminBadge: {
    backgroundColor: '#e94560',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adminBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  greeting: { color: '#94a3b8', fontSize: 13 },
  adminName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: { color: '#e94560', fontSize: 13, fontWeight: '600' },

  // Content
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 20,
    marginBottom: 12,
  },

  // Driver banner
  driverBanner: {
    marginTop: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  driverBannerLeft: { flex: 1 },
  driverBannerTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  driverBannerSub: { color: '#94a3b8', fontSize: 12 },
  driverBannerRight: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  driverBannerCta: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Stats
  statsRow: { marginHorizontal: -4 },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    width: 110,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  // Quick actions
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: {
    width: '30.5%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: { fontSize: 20 },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center' },

  // Activity
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  activityDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDotIcon: { fontSize: 16 },
  activityText: { flex: 1 },
  activityDescription: { fontSize: 13, color: '#334155', fontWeight: '500', marginBottom: 2 },
  activityTime: { fontSize: 11, color: '#94a3b8' },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 10,
  },
  navTab: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22, marginBottom: 2 },
  navIconActive: { transform: [{ scale: 1.1 }] },
  navLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navLabelActive: { color: '#e94560', fontWeight: '700' },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  navBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

export default AdminHomescreen;