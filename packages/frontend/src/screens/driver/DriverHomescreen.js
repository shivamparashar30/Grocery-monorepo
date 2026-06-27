// screens/driver/DriverHomescreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { clearUserData } from '../../store/slices/userSlice';
import {
  toggleAvailability,
  seedAvailability,
  clearDriverError,
} from '../../store/slices/driverSlice';

const DriverHomescreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: user }                            = useSelector((state) => state.user);
  const { isAvailable, availabilityLoading, error } = useSelector((state) => state.driver);
  const [activeTab, setActiveTab]                 = useState('home');

  // Seed the toggle with the value stored on the user object so that when
  // a driver logs back in, the switch reflects their last-known status.
  useEffect(() => {
    if (user?.isAvailable !== undefined) {
      dispatch(seedAvailability(user.isAvailable));
    }
  }, [user?.isAvailable]);

  // Surface API errors as alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => dispatch(clearDriverError()) },
      ]);
    }
  }, [error]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(clearUserData());
  };

  // FIX: was a TODO — now dispatches the real thunk.
  // The Switch is disabled while the request is in-flight so the driver
  // cannot double-tap and send conflicting requests.
  const handleToggleAvailability = () => {
    if (availabilityLoading) return;
    dispatch(toggleAvailability());
  };

  const pendingDeliveries = [
    {
      id: '#4821',
      customer: 'Priya Sharma',
      address: '14, Rose Garden Colony, Jaipur',
      items: 4,
      distance: '2.3 km',
      amount: '₹348',
      status: 'pickup',
    },
    {
      id: '#4820',
      customer: 'Ravi Kumar',
      address: '7B, Civil Lines, Jaipur',
      items: 2,
      distance: '4.1 km',
      amount: '₹195',
      status: 'enroute',
    },
  ];

  const stats = [
    { label: 'Today',  value: '8',    unit: 'deliveries' },
    { label: 'Earned', value: '₹640', unit: 'today'      },
    { label: 'Rating', value: '4.8',  unit: '★'          },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hey, {user?.name?.split(' ')[0] || 'Driver'} 👋
          </Text>
          <View style={styles.vehicleRow}>
            <Text style={styles.vehicleTag}>
              🚗 {user?.vehicleType ? user.vehicleType.toUpperCase() : 'VEHICLE'}
            </Text>
            {user?.vehicleNumber && (
              <Text style={styles.vehicleNumber}>{user.vehicleNumber}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>⇠ Exit</Text>
        </TouchableOpacity>
      </View>

      {/* ── Online / Offline Toggle Card ── */}
      <View
        style={[
          styles.toggleCard,
          isAvailable ? styles.toggleCardOnline : styles.toggleCardOffline,
        ]}
      >
        <View style={styles.toggleLeft}>
          <Text style={styles.toggleTitle}>
            {isAvailable ? '🟢 You are Online' : '🔴 You are Offline'}
          </Text>
          <Text style={styles.toggleSubtitle}>
            {availabilityLoading
              ? 'Updating status…'
              : isAvailable
              ? 'Ready to receive delivery requests'
              : 'Toggle to start accepting orders'}
          </Text>
        </View>

        {/* Show a small spinner next to the switch while the API call is running */}
        {availabilityLoading ? (
          <ActivityIndicator
            size="small"
            color={isAvailable ? '#16a34a' : '#94a3b8'}
            style={styles.toggleSpinner}
          />
        ) : (
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            disabled={availabilityLoading}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={isAvailable ? '#16a34a' : '#94a3b8'}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statUnit}>{s.unit}</Text>
            </View>
          ))}
        </View>

        {/* ── Deliveries ── */}
        <Text style={styles.sectionTitle}>
          {isAvailable ? '📦 Active Deliveries' : '📋 Queue Preview'}
        </Text>

        {!isAvailable && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              Go online to start receiving delivery assignments
            </Text>
          </View>
        )}

        {pendingDeliveries.map((delivery) => (
          <View key={delivery.id} style={styles.deliveryCard}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryId}>{delivery.id}</Text>
              <View
                style={[
                  styles.statusBadge,
                  delivery.status === 'pickup'
                    ? styles.statusPickup
                    : styles.statusEnroute,
                ]}
              >
                <Text style={styles.statusText}>
                  {delivery.status === 'pickup' ? '📍 Pickup' : '🚗 En Route'}
                </Text>
              </View>
            </View>

            <View style={styles.deliveryBody}>
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryIcon}>👤</Text>
                <Text style={styles.deliveryInfo}>{delivery.customer}</Text>
              </View>
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryIcon}>📍</Text>
                <Text style={styles.deliveryInfo}>{delivery.address}</Text>
              </View>
              <View style={styles.deliveryMeta}>
                <Text style={styles.deliveryMetaItem}>📦 {delivery.items} items</Text>
                <Text style={styles.deliveryMetaItem}>📏 {delivery.distance}</Text>
                <Text style={[styles.deliveryMetaItem, styles.deliveryAmount]}>
                  {delivery.amount}
                </Text>
              </View>
            </View>

            <View style={styles.deliveryActions}>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                disabled={!isAvailable}
              >
                <Text style={styles.actionBtnSecondaryText}>View Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtnPrimary,
                  !isAvailable && styles.disabledBtn,
                ]}
                disabled={!isAvailable}
              >
                <Text style={styles.actionBtnPrimaryText}>
                  {delivery.status === 'pickup'
                    ? 'Mark Picked Up'
                    : 'Mark Delivered'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* ── Earnings Summary ── */}
        <Text style={styles.sectionTitle}>💰 This Week</Text>
        <View style={styles.earningsCard}>
          {[
            ['Mon', '₹580', 6],
            ['Tue', '₹720', 8],
            ['Wed', '₹430', 5],
            ['Thu', '₹890', 10],
            ['Fri', '₹640', 8],
          ].map(([day, amount, count]) => (
            <View key={day} style={styles.earningRow}>
              <Text style={styles.earningDay}>{day}</Text>
              <View style={styles.earningBarBg}>
                <View
                  style={[
                    styles.earningBar,
                    { width: `${(count / 10) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.earningAmount}>{amount}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home',       icon: '🏠', label: 'Home'       },
          { id: 'deliveries', icon: '📦', label: 'Deliveries' },
          { id: 'earnings',   icon: '💰', label: 'Earnings'   },
          { id: 'profile',    icon: '👤', label: 'Profile'    },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navTab}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.navLabel,
                activeTab === tab.id && styles.navLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles (identical to original — no layout changes) ───────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  vehicleTag: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  vehicleNumber: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },

  // Toggle card
  toggleCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleCardOnline:  { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac' },
  toggleCardOffline: { backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fca5a5' },
  toggleLeft: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  toggleSubtitle: { fontSize: 12, color: '#64748b' },
  toggleSpinner: { marginRight: 4 },

  content: { flex: 1, paddingHorizontal: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statUnit:  { fontSize: 10, color: '#94a3b8' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 10,
  },
  offlineBanner: {
    backgroundColor: '#fef9c3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#eab308',
  },
  offlineBannerText: { color: '#854d0e', fontSize: 13, fontWeight: '500' },

  // Delivery cards
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryId: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusPickup:  { backgroundColor: '#eff6ff' },
  statusEnroute: { backgroundColor: '#f0fdf4' },
  statusText: { fontSize: 11, fontWeight: '700' },
  deliveryBody: { gap: 6, marginBottom: 14 },
  deliveryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  deliveryIcon: { fontSize: 14, width: 20 },
  deliveryInfo: { fontSize: 13, color: '#334155', flex: 1 },
  deliveryMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  deliveryMetaItem: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  deliveryAmount: { color: '#16a34a', fontWeight: '700' },
  deliveryActions: { flexDirection: 'row', gap: 10 },
  actionBtnSecondary: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnSecondaryText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  actionBtnPrimary: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  disabledBtn: { opacity: 0.4 },

  // Earnings
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  earningRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  earningDay: { width: 32, fontSize: 12, color: '#64748b', fontWeight: '600' },
  earningBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  earningBar: { height: 8, backgroundColor: '#2563eb', borderRadius: 4 },
  earningAmount: {
    width: 48,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
  },

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
  navLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navLabelActive: { color: '#2563eb', fontWeight: '700' },
});

export default DriverHomescreen;