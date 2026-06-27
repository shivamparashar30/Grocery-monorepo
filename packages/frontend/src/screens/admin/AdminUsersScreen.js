import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';

const MOCK_USERS = Array.from({ length: 20 }, (_, i) => ({
  _id:      `user_${i}`,
  name:     `User ${i + 1}`,
  email:    `user${i + 1}@example.com`,
  phone:    `98${String(10000000 + i).slice(1)}`,
  orders:   Math.floor(Math.random() * 30),
  spent:    `₹${(Math.random() * 5000 + 200).toFixed(0)}`,
  joined:   'Apr 2025',
  isBlocked: i % 7 === 0,
}));

const UserCard = ({ user }) => {
  const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={[styles.card, user.isBlocked && styles.cardBlocked]}>
      <View style={[styles.avatar, { backgroundColor: user.isBlocked ? '#fecaca' : '#e0f2fe' }]}>
        <Text style={[styles.avatarText, { color: user.isBlocked ? '#dc2626' : '#0369a1' }]}>
          {initials}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.name}>{user.name}</Text>
          {user.isBlocked && (
            <View style={styles.blockedPill}>
              <Text style={styles.blockedText}>Blocked</Text>
            </View>
          )}
        </View>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.phone}>📱 {user.phone}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>📦 {user.orders} orders</Text>
          <Text style={styles.stat}>💰 {user.spent}</Text>
          <Text style={styles.stat}>📅 {user.joined}</Text>
        </View>
      </View>
    </View>
  );
};

const AdminUsersScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const displayed = MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Users</Text>
          <Text style={styles.headerSub}>{MOCK_USERS.length} registered users</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Total',   value: MOCK_USERS.length,                             color: '#6366f1', bg: '#eef2ff' },
          { label: 'Active',  value: MOCK_USERS.filter((u) => !u.isBlocked).length, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Blocked', value: MOCK_USERS.filter((u) => u.isBlocked).length,  color: '#ef4444', bg: '#fef2f2' },
        ].map((s) => (
          <View key={s.label} style={[styles.summaryItem, { backgroundColor: s.bg }]}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <Text>🔍 </Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <UserCard user={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1a1a2e', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ffffff18', justifyContent: 'center', alignItems: 'center',
  },
  backIcon:    { color: '#fff', fontSize: 20, lineHeight: 22 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:   { color: '#94a3b8', fontSize: 12 },
  summaryRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  summaryItem:  { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 1 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardBlocked: { borderColor: '#fecaca', backgroundColor: '#fffafa' },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  cardBody:   { flex: 1 },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name:       { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  blockedPill:{ backgroundColor: '#fef2f2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  blockedText:{ color: '#ef4444', fontSize: 10, fontWeight: '700' },
  email:      { fontSize: 11, color: '#64748b', marginBottom: 2 },
  phone:      { fontSize: 12, color: '#334155', marginBottom: 6 },
  statsRow:   { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  stat:       { fontSize: 11, color: '#64748b' },
});

export default AdminUsersScreen;
