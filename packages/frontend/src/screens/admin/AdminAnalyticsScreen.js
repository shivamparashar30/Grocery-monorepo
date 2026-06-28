import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/apiconfig';

const { width } = Dimensions.get('window');
const STATS_API = `${BASE_URL}/home-sections/admin/stats`;

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#06B6D4',
  delivered: '#22C55E',
  cancelled: '#EF4444',
};

const AdminAnalyticsScreen = ({ navigation }) => {
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
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const formatCurrency = (n) => {
    if (!n) return 'Rs. 0';
    if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}K`;
    return `Rs. ${n}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
      >
        {/* Metric cards */}
        <View style={styles.metricsGrid}>
          {[
            { icon: 'wallet', color: '#22C55E', bg: '#DCFCE7', label: 'Revenue', value: formatCurrency(stats?.revenue) },
            { icon: 'receipt', color: '#3B82F6', bg: '#DBEAFE', label: 'Orders', value: stats?.orderCount ?? 0 },
            { icon: 'people', color: '#8B5CF6', bg: '#EDE9FE', label: 'Customers', value: stats?.userCount ?? 0 },
            { icon: 'cube', color: '#F59E0B', bg: '#FEF3C7', label: 'Products', value: stats?.productCount ?? 0 },
          ].map((m) => (
            <View key={m.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>
                <Icon name={m.icon} size={18} color={m.color} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Orders by Status */}
        {stats?.ordersByStatus?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orders by Status</Text>
            <View style={styles.sectionCard}>
              {stats.ordersByStatus.map((s) => {
                const pct = stats.orderCount
                  ? Math.round((s.count / stats.orderCount) * 100)
                  : 0;
                return (
                  <View key={s._id} style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s._id] || '#94A3B8' }]} />
                    <Text style={styles.statusLabel}>{s._id || 'unknown'}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: STATUS_COLORS[s._id] || '#94A3B8',
                            width: `${Math.max(pct, 3)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.statusCount}>{s.count}</Text>
                    <Text style={styles.statusPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Low Stock */}
        {stats?.lowStockProducts?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Low Stock Products</Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{stats.lowStockProducts.length} items</Text>
              </View>
            </View>
            <View style={styles.sectionCard}>
              {stats.lowStockProducts.map((p) => (
                <View key={p._id} style={styles.productRow}>
                  <View style={styles.productBadge}>
                    <Text style={styles.productKey}>{p.productKey?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.productPrice}>Rs. {p.price}</Text>
                  </View>
                  <View style={[
                    styles.stockPill,
                    { backgroundColor: p.stock === 0 ? '#FEE2E2' : '#FEF3C7' },
                  ]}>
                    <Text style={[
                      styles.stockText,
                      { color: p.stock === 0 ? '#DC2626' : '#D97706' },
                    ]}>
                      {p.stock === 0 ? 'Out' : p.stock}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Summary</Text>
          <View style={styles.sectionCard}>
            <View style={styles.summaryRow}>
              <Icon name="layers" size={18} color="#6C5CE7" />
              <Text style={styles.summaryLabel}>Home Sections</Text>
              <Text style={styles.summaryValue}>{stats?.sectionCount ?? 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Icon name="cart" size={18} color="#3B82F6" />
              <Text style={styles.summaryLabel}>Avg Order Value</Text>
              <Text style={styles.summaryValue}>
                {stats?.orderCount
                  ? formatCurrency(Math.round(stats.revenue / stats.orderCount))
                  : 'Rs. 0'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  // Metrics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  metricLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  // Section
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Status rows
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { width: 72, fontSize: 12, fontWeight: '600', color: '#475569', textTransform: 'capitalize' },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },
  statusCount: { width: 26, fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
  statusPct: { width: 32, fontSize: 11, color: '#94A3B8', textAlign: 'right' },

  // Products
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  productBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productKey: { fontSize: 10, fontWeight: '800', color: '#475569' },
  productName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  productPrice: { fontSize: 11, color: '#64748B', marginTop: 1 },
  stockPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  stockText: { fontSize: 12, fontWeight: '700' },

  alertBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  alertBadgeText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  summaryLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#475569' },
  summaryValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
});

export default AdminAnalyticsScreen;
