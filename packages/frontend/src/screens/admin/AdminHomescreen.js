import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { clearUserData } from '../../store/slices/userSlice';
import { fetchAllDrivers } from '../../store/slices/driversSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL } from '../../config/apiconfig';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48 - 12) / 2;

const STATS_API = `${BASE_URL}/home-sections/admin/stats`;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, iconColor, iconBg, label, value, sub }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={20} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
  </View>
);

// ── Quick Action ─────────────────────────────────────────────────────────────
const QuickAction = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickIcon, { backgroundColor: color + '15' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
    <Icon name="chevron-forward" size={14} color="#CBD5E1" />
  </TouchableOpacity>
);

// ── Low Stock Item ───────────────────────────────────────────────────────────
const LowStockItem = ({ product }) => (
  <View style={styles.lowStockItem}>
    <View style={styles.lowStockLeft}>
      <View style={styles.lowStockBadge}>
        <Text style={styles.lowStockKey}>{product.productKey?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.lowStockName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.lowStockPrice}>Rs. {product.price}</Text>
      </View>
    </View>
    <View style={[
      styles.stockPill,
      { backgroundColor: product.stock === 0 ? '#FEE2E2' : '#FEF3C7' },
    ]}>
      <Text style={[
        styles.stockPillText,
        { color: product.stock === 0 ? '#DC2626' : '#D97706' },
      ]}>
        {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
      </Text>
    </View>
  </View>
);

// ── Recent Order ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#06B6D4',
  delivered: '#22C55E',
  cancelled: '#EF4444',
};

const RecentOrder = ({ order }) => {
  const statusColor = STATUS_COLOR[order.status] || '#94A3B8';
  const date = new Date(order.createdAt);
  const timeAgo = getTimeAgo(date);

  return (
    <View style={styles.orderItem}>
      <View style={[styles.orderDot, { backgroundColor: statusColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.orderCustomer} numberOfLines={1}>
          {order.user?.name || 'Customer'}
        </Text>
        <Text style={styles.orderMeta}>
          {order.orderItems?.length || 0} items · {timeAgo}
        </Text>
      </View>
      <View>
        <Text style={styles.orderAmount}>Rs. {order.totalPrice?.toFixed(0) || 0}</Text>
        <View style={[styles.orderStatus, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.orderStatusText, { color: statusColor }]}>
            {order.status}
          </Text>
        </View>
      </View>
    </View>
  );
};

const getTimeAgo = (date) => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminHomescreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: user } = useSelector((s) => s.user);
  const { all: allDrivers } = useSelector((s) => s.drivers);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(STATS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    dispatch(fetchAllDrivers());
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
    dispatch(fetchAllDrivers({ refresh: true }));
  }, []);

  const onlineDrivers = allDrivers.filter((d) => d.isAvailable && !d.isBlocked).length;

  const formatCurrency = (n) => {
    if (!n) return 'Rs. 0';
    if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}K`;
    return `Rs. ${n}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" translucent />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#1E1B4B' }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" translucent />

      <ScrollView
        style={{ backgroundColor: '#F8FAFC' }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* ── Gradient Header ── */}
        <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('AdminNotifications')}
              activeOpacity={0.7}
            >
              <Icon name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          {/* ── Live Driver Strip ── */}
          {allDrivers.length > 0 && (
            <TouchableOpacity
              style={styles.driverStrip}
              onPress={() => navigation.navigate('RidersTab')}
              activeOpacity={0.8}
            >
              <View style={styles.driverStripDot} />
              <Text style={styles.driverStripText}>
                {onlineDrivers} rider{onlineDrivers !== 1 ? 's' : ''} online
              </Text>
              <Text style={styles.driverStripSep}>·</Text>
              <Text style={styles.driverStripText}>
                {allDrivers.length} total
              </Text>
              <Icon name="chevron-forward" size={14} color="#A5B4FC" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="people"
            iconColor="#6C5CE7"
            iconBg="#EDE9FE"
            label="Customers"
            value={stats?.userCount ?? 0}
          />
          <StatCard
            icon="cube"
            iconColor="#3B82F6"
            iconBg="#DBEAFE"
            label="Products"
            value={stats?.productCount ?? 0}
          />
          <StatCard
            icon="receipt"
            iconColor="#F59E0B"
            iconBg="#FEF3C7"
            label="Orders"
            value={stats?.orderCount ?? 0}
          />
          <StatCard
            icon="wallet"
            iconColor="#22C55E"
            iconBg="#DCFCE7"
            label="Revenue"
            value={formatCurrency(stats?.revenue)}
          />
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <QuickAction
              icon="layers-outline"
              label="Home Sections"
              color="#E91E63"
              onPress={() => navigation.navigate('AdminSections')}
            />
            <QuickAction
              icon="person-add-outline"
              label="Add Rider"
              color="#22C55E"
              onPress={() => navigation.navigate('RegisterDriver')}
            />
            <QuickAction
              icon="people-outline"
              label="Customers"
              color="#3B82F6"
              onPress={() => navigation.navigate('AdminUsers')}
            />
            <QuickAction
              icon="bar-chart-outline"
              label="Analytics"
              color="#8B5CF6"
              onPress={() => navigation.navigate('AdminAnalytics')}
            />
          </View>
        </View>

        {/* ── Low Stock Alert ── */}
        {stats?.lowStockProducts?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Low Stock Alert</Text>
              <View style={styles.alertBadge}>
                <Icon name="alert-circle" size={12} color="#DC2626" />
                <Text style={styles.alertBadgeText}>{stats.lowStockProducts.length}</Text>
              </View>
            </View>
            <View style={styles.lowStockCard}>
              {stats.lowStockProducts.slice(0, 5).map((p) => (
                <LowStockItem key={p._id} product={p} />
              ))}
            </View>
          </View>
        )}

        {/* ── Recent Orders ── */}
        {stats?.recentOrders?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ordersCard}>
              {stats.recentOrders.map((o) => (
                <RecentOrder key={o._id} order={o} />
              ))}
            </View>
          </View>
        )}

        {/* ── Order Status Breakdown ── */}
        {stats?.ordersByStatus?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={styles.statusCard}>
              {stats.ordersByStatus.map((s) => (
                <View key={s._id} style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[s._id] || '#94A3B8' }]} />
                  <Text style={styles.statusLabel}>{s._id || 'unknown'}</Text>
                  <View style={styles.statusBarTrack}>
                    <View
                      style={[
                        styles.statusBarFill,
                        {
                          backgroundColor: STATUS_COLOR[s._id] || '#94A3B8',
                          width: `${Math.min((s.count / (stats?.orderCount || 1)) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.statusCount}>{s.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: { color: '#A5B4FC', fontSize: 13, fontWeight: '500' },
  adminName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 2 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#312E81',
  },

  // Driver strip
  driverStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  driverStripDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  driverStripText: { color: '#C7D2FE', fontSize: 13, fontWeight: '600' },
  driverStripSep: { color: '#6366F1', fontSize: 13 },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: -10,
  },
  statCard: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  statSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#6C5CE7' },

  // Quick actions
  quickGrid: { gap: 8 },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },

  // Low stock
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  alertBadgeText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  lowStockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lowStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lowStockLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  lowStockBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowStockKey: { fontSize: 10, fontWeight: '800', color: '#475569' },
  lowStockName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  lowStockPrice: { fontSize: 11, color: '#64748B', marginTop: 1 },
  stockPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  stockPillText: { fontSize: 11, fontWeight: '700' },

  // Recent orders
  ordersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  orderDot: { width: 8, height: 8, borderRadius: 4 },
  orderCustomer: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  orderMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  orderAmount: { fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
  orderStatus: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3, alignSelf: 'flex-end' },
  orderStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  // Order Status breakdown
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: {
    width: 72,
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  statusBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusBarFill: { height: 6, borderRadius: 3 },
  statusCount: { width: 28, fontSize: 12, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
});

export default AdminHomescreen;
