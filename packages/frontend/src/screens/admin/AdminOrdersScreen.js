import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';

const STATUS_FILTERS = ['All', 'Pending', 'Assigned', 'Delivered', 'Cancelled'];

const STATUS_META = {
  Pending:   { color: '#f59e0b', bg: '#fef3c7' },
  Assigned:  { color: '#3b82f6', bg: '#eff6ff' },
  Delivered: { color: '#22c55e', bg: '#f0fdf4' },
  Cancelled: { color: '#ef4444', bg: '#fef2f2' },
};

// Mock data — replace with Redux selector
const MOCK_ORDERS = Array.from({ length: 20 }, (_, i) => {
  const statuses = ['Pending', 'Assigned', 'Delivered', 'Cancelled'];
  const status   = statuses[i % 4];
  return {
    id:       `ORD-${4800 + i}`,
    customer: `Customer ${i + 1}`,
    amount:   `₹${(Math.random() * 1000 + 100).toFixed(0)}`,
    items:    Math.floor(Math.random() * 5) + 1,
    status,
    time:     `${Math.floor(Math.random() * 59) + 1} min ago`,
    address:  'Jaipur, Rajasthan',
  };
});

const OrderCard = ({ order }) => {
  const meta = STATUS_META[order.status] || STATUS_META.Pending;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.orderId}>{order.id}</Text>
        <View style={[styles.pill, { backgroundColor: meta.bg }]}>
          <Text style={[styles.pillText, { color: meta.color }]}>{order.status}</Text>
        </View>
      </View>
      <Text style={styles.customer}>👤 {order.customer}</Text>
      <Text style={styles.address}>📍 {order.address}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.meta}>🛍️ {order.items} items</Text>
        <Text style={styles.meta}>⏱️ {order.time}</Text>
        <Text style={styles.amount}>{order.amount}</Text>
      </View>
    </View>
  );
};

const AdminOrdersScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch]             = useState('');

  const displayed = MOCK_ORDERS.filter((o) => {
    const matchFilter = activeFilter === 'All' || o.status === activeFilter;
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
                        o.customer.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Orders</Text>
          <Text style={styles.headerSub}>{MOCK_ORDERS.length} total orders</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order ID or customer..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ffffff18',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon:    { color: '#fff', fontSize: 20, lineHeight: 22 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:   { color: '#94a3b8', fontSize: 12 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    paddingHorizontal: 14, height: 46,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 12,
    gap: 6, marginBottom: 8, flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  filterTabActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  filterText:      { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterTextActive:{ color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId:    { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  pill:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillText:   { fontSize: 11, fontWeight: '700' },
  customer:   { fontSize: 13, color: '#334155', marginBottom: 2 },
  address:    { fontSize: 12, color: '#64748b', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta:       { fontSize: 12, color: '#64748b' },
  amount:     { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
});

export default AdminOrdersScreen;
