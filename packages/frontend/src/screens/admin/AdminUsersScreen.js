import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { BASE_URL, AUTH_URL } from '../../config/apiconfig';

const USERS_API = `${AUTH_URL}/users`;

const FILTERS = ['All', 'Active', 'Blocked'];

// ── User Card ────────────────────────────────────────────────────────────────
const UserCard = ({ user, onToggleBlock, actionLoading }) => {
  const isActing = actionLoading === user._id;
  const initials = (user.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.card, user.isBlocked && styles.cardBlocked]}>
      <View style={[styles.avatar, { backgroundColor: user.isBlocked ? '#FEE2E2' : '#EDE9FE' }]}>
        <Text style={[styles.avatarText, { color: user.isBlocked ? '#DC2626' : '#6C5CE7' }]}>
          {initials}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
          {user.isBlocked && (
            <View style={styles.blockedPill}>
              <Text style={styles.blockedText}>Blocked</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
        {user.phone && (
          <View style={styles.phoneRow}>
            <Icon name="call-outline" size={12} color="#64748B" />
            <Text style={styles.phoneText}>{user.phone}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.actionBtn,
          user.isBlocked ? styles.actionUnblock : styles.actionBlock,
          isActing && { opacity: 0.5 },
        ]}
        onPress={() => onToggleBlock(user)}
        disabled={isActing}
        activeOpacity={0.7}
      >
        {isActing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Icon
            name={user.isBlocked ? 'checkmark' : 'ban'}
            size={16}
            color="#fff"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(USERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  const handleToggleBlock = useCallback((user) => {
    const action = user.isBlocked ? 'unblock' : 'block';
    Alert.alert(
      `${user.isBlocked ? 'Unblock' : 'Block'} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.isBlocked ? 'Unblock' : 'Block',
          style: user.isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setActionLoading(user._id);
              const token = await AsyncStorage.getItem('token');
              const res = await fetch(`${AUTH_URL}/users/${user._id}/toggle-status`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (data.success) {
                setUsers((prev) =>
                  prev.map((u) =>
                    u._id === user._id ? { ...u, isBlocked: !u.isBlocked } : u
                  )
                );
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to update user status');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, []);

  const displayed = useMemo(() => {
    let list = users;
    if (activeFilter === 'Active') list = list.filter((u) => !u.isBlocked);
    if (activeFilter === 'Blocked') list = list.filter((u) => u.isBlocked);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q)
      );
    }
    return list;
  }, [users, activeFilter, search]);

  const counts = useMemo(() => ({
    All: users.length,
    Active: users.filter((u) => !u.isBlocked).length,
    Blocked: users.filter((u) => u.isBlocked).length,
  }), [users]);

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
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Customers</Text>
          <Text style={styles.headerSub}>{users.length} registered</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Total', value: counts.All, color: '#6C5CE7', bg: '#EDE9FE' },
          { label: 'Active', value: counts.Active, color: '#16A34A', bg: '#DCFCE7' },
          { label: 'Blocked', value: counts.Blocked, color: '#DC2626', bg: '#FEE2E2' },
        ].map((s) => (
          <View key={s.label} style={[styles.summaryItem, { backgroundColor: s.bg }]}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone..."
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

      {/* Filter */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f}
              </Text>
              <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, isActive && { color: '#fff' }]}>
                  {counts[f]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={displayed}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onToggleBlock={handleToggleBlock}
            actionLoading={actionLoading}
          />
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
            <Icon name="people-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No users found</Text>
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
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 1 },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: '#475569', fontWeight: '600', marginTop: 2 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  filterTabActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },
  filterCount: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterCountText: { fontSize: 10, fontWeight: '800', color: '#64748B' },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 24 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBlocked: { borderWidth: 1, borderColor: '#FECACA' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  userName: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 6 },
  blockedPill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  blockedText: { color: '#DC2626', fontSize: 9, fontWeight: '700' },
  userEmail: { fontSize: 11, color: '#94A3B8' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  phoneText: { fontSize: 11, color: '#64748B' },

  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionBlock: { backgroundColor: '#1E293B' },
  actionUnblock: { backgroundColor: '#22C55E' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
});

export default AdminUsersScreen;
