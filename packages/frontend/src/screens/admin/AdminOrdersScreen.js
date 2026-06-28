import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/apiconfig';

const ORDERS_API = `${BASE_URL}/orders`;

const STATUS_FILTERS = ['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_LABELS = {
  All: 'All',
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_META = {
  pending:    { color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  confirmed:  { color: '#3B82F6', bg: '#DBEAFE', icon: 'checkmark-circle-outline' },
  processing: { color: '#8B5CF6', bg: '#EDE9FE', icon: 'construct-outline' },
  shipped:    { color: '#06B6D4', bg: '#CFFAFE', icon: 'car-outline' },
  delivered:  { color: '#22C55E', bg: '#DCFCE7', icon: 'checkmark-done-circle-outline' },
  cancelled:  { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' },
};

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};

const getTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = ({ order, onUpdateStatus }) => {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const nextStatus = NEXT_STATUS[order.status];
  const date = new Date(order.createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>#{order._id?.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderTime}>{getTimeAgo(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={12} color={meta.color} />
          <Text style={[styles.statusText, { color: meta.color }]}>
            {order.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardMid}>
        <View style={styles.infoRow}>
          <Icon name="person-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>{order.user?.name || 'Customer'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="bag-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>
            {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        {order.shippingAddress?.city && (
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={14} color="#64748B" />
            <Text style={styles.infoText} numberOfLines={1}>
              {order.shippingAddress.city}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>Rs. {order.totalPrice?.toFixed(0) || 0}</Text>
        </View>
        {nextStatus && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: STATUS_META[nextStatus]?.color || '#6C5CE7' }]}
            onPress={() => onUpdateStatus(order._id, nextStatus)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              Mark {nextStatus}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${ORDERS_API}/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status } : o))
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update order status');
    }
  }, []);

  const displayed = useMemo(() => {
    let list = orders;
    if (activeFilter !== 'All') {
      list = list.filter((o) => o.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o._id?.toLowerCase().includes(q) ||
          o.user?.name?.toLowerCase().includes(q) ||
          o.user?.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeFilter, search]);

  const statusCounts = useMemo(() => {
    const counts = { All: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSub}>{orders.length} total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID or customer..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map((item) => {
          const isActive = activeFilter === item;
          const meta = STATUS_META[item];
          const count = statusCounts[item] || 0;
          const chipColor = meta?.color || '#6C5CE7';
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterChip,
                isActive && { backgroundColor: chipColor, borderColor: chipColor },
              ]}
              onPress={() => setActiveFilter(item)}
              activeOpacity={0.7}
            >
              {isActive && meta?.icon && (
                <Icon name={meta.icon} size={12} color="#FFF" style={{ marginRight: 3 }} />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  isActive && { color: '#FFF' },
                ]}
              >
                {STATUS_LABELS[item]}
              </Text>
              {count > 0 && (
                <View style={[
                  styles.filterBadge,
                  isActive && { backgroundColor: 'rgba(255,255,255,0.25)' },
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    isActive && { color: '#FFF' },
                  ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Orders list */}
      <FlatList
        data={displayed}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <OrderCard order={item} onUpdateStatus={updateOrderStatus} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C5CE7"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="receipt-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search term' : 'Orders will appear here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

  // Filters
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 24 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  orderTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  cardMid: { gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, color: '#475569' },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: { fontSize: 11, color: '#94A3B8' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  actionBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
});

export default AdminOrdersScreen;
