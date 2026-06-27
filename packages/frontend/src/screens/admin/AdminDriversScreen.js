// screens/admin/AdminDriversScreen.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllDrivers,
  toggleDriverBlockStatus,
  clearDriversError,
} from '../../store/slices/driversSlice';

// ─── constants ────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',      label: 'All'      },
  { id: 'online',   label: 'Online'   },
  { id: 'offline',  label: 'Offline'  },
  { id: 'blocked',  label: 'Blocked'  },
];

const VEHICLE_ICONS = {
  bike:    '🏍️',
  scooter: '🛵',
  car:     '🚗',
  van:     '🚐',
};

// ─── StatusPill ───────────────────────────────────────────────────────────────
const StatusPill = ({ isAvailable, isBlocked }) => {
  if (isBlocked) {
    return (
      <View style={[styles.pill, styles.pillBlocked]}>
        <View style={[styles.pillDot, { backgroundColor: '#ef4444' }]} />
        <Text style={[styles.pillText, { color: '#ef4444' }]}>Blocked</Text>
      </View>
    );
  }
  if (isAvailable) {
    return (
      <View style={[styles.pill, styles.pillOnline]}>
        <View style={[styles.pillDot, { backgroundColor: '#22c55e' }]} />
        <Text style={[styles.pillText, { color: '#22c55e' }]}>Online</Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, styles.pillOffline]}>
      <View style={[styles.pillDot, { backgroundColor: '#94a3b8' }]} />
      <Text style={[styles.pillText, { color: '#94a3b8' }]}>Offline</Text>
    </View>
  );
};

// ─── SummaryBar ───────────────────────────────────────────────────────────────
const SummaryBar = ({ all }) => {
  const online  = all.filter((d) => d.isAvailable && !d.isBlocked).length;
  const offline = all.filter((d) => !d.isAvailable && !d.isBlocked).length;
  const blocked = all.filter((d) => d.isBlocked).length;

  const items = [
    { label: 'Total',   value: all.length, color: '#6366f1', bg: '#eef2ff' },
    { label: 'Online',  value: online,     color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Offline', value: offline,    color: '#94a3b8', bg: '#f8fafc' },
    { label: 'Blocked', value: blocked,    color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <View style={styles.summaryBar}>
      {items.map((item) => (
        <View key={item.label} style={[styles.summaryItem, { backgroundColor: item.bg }]}>
          <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
          <Text style={styles.summaryLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── DriverCard ───────────────────────────────────────────────────────────────
const DriverCard = ({ driver, onToggleBlock, actionLoading }) => {
  const isActing = actionLoading === driver._id;
  const vehicleIcon = VEHICLE_ICONS[driver.vehicleType] || '🚗';
  const initials = (driver.name || 'D')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarBg = driver.isBlocked
    ? '#fecaca'
    : driver.isAvailable
    ? '#bbf7d0'
    : '#e2e8f0';

  const avatarText = driver.isBlocked ? '#dc2626' : driver.isAvailable ? '#16a34a' : '#475569';

  return (
    <View style={[styles.card, driver.isBlocked && styles.cardBlocked]}>
      {/* Left: avatar + online pulse */}
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={[styles.avatarText, { color: avatarText }]}>{initials}</Text>
        </View>
        {/* Live pulse dot — only when online and not blocked */}
        {driver.isAvailable && !driver.isBlocked && (
          <View style={styles.pulseDot} />
        )}
      </View>

      {/* Middle: driver info */}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.driverName} numberOfLines={1}>{driver.name}</Text>
          <StatusPill isAvailable={driver.isAvailable} isBlocked={driver.isBlocked} />
        </View>

        <Text style={styles.driverEmail} numberOfLines={1}>{driver.email}</Text>

        <View style={styles.metaRow}>
          {driver.vehicleType && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{vehicleIcon} {driver.vehicleType}</Text>
            </View>
          )}
          {driver.vehicleNumber && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>🔢 {driver.vehicleNumber}</Text>
            </View>
          )}
          {driver.phone && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>📱 {driver.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statItem}>
            📦 <Text style={styles.statBold}>{driver.totalDeliveries ?? 0}</Text> deliveries
          </Text>
          <Text style={styles.statItem}>
            ⭐ <Text style={styles.statBold}>{driver.driverRating ?? 0}</Text> rating
          </Text>
        </View>
      </View>

      {/* Right: block/unblock button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          driver.isBlocked ? styles.actionBtnUnblock : styles.actionBtnBlock,
          isActing && styles.actionBtnDisabled,
        ]}
        onPress={() => onToggleBlock(driver)}
        disabled={isActing}
        activeOpacity={0.75}
      >
        {isActing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.actionBtnText}>
            {driver.isBlocked ? '✓\nUnblock' : '✕\nBlock'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ filter, search }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>
      {search ? '🔍' : filter === 'online' ? '📡' : filter === 'blocked' ? '🚫' : '🚗'}
    </Text>
    <Text style={styles.emptyTitle}>
      {search
        ? 'No drivers match your search'
        : filter === 'online'
        ? 'No drivers online right now'
        : filter === 'blocked'
        ? 'No blocked drivers'
        : 'No drivers registered yet'}
    </Text>
    <Text style={styles.emptySubtitle}>
      {search ? 'Try a different name, email, or vehicle number' : 'Pull down to refresh'}
    </Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
const AdminDriversScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { all, loading, refreshing, error, actionLoading } = useSelector(
    (state) => state.drivers
  );

  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Initial fetch
  useEffect(() => {
    dispatch(fetchAllDrivers());
  }, []);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: () => dispatch(clearDriversError()) }]);
    }
  }, [error]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    dispatch(fetchAllDrivers({ refresh: true }));
  }, []);

  // Filter + search
  const displayed = useMemo(() => {
    let list = all;

    if (activeFilter === 'online')  list = list.filter((d) => d.isAvailable && !d.isBlocked);
    if (activeFilter === 'offline') list = list.filter((d) => !d.isAvailable && !d.isBlocked);
    if (activeFilter === 'blocked') list = list.filter((d) => d.isBlocked);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.vehicleNumber?.toLowerCase().includes(q) ||
          d.phone?.includes(q)
      );
    }

    return list;
  }, [all, activeFilter, search]);

  // Block / unblock with confirmation
  const handleToggleBlock = useCallback(
    (driver) => {
      const action = driver.isBlocked ? 'unblock' : 'block';
      Alert.alert(
        `${driver.isBlocked ? 'Unblock' : 'Block'} Driver`,
        `Are you sure you want to ${action} ${driver.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: driver.isBlocked ? 'Unblock' : 'Block',
            style: driver.isBlocked ? 'default' : 'destructive',
            onPress: () => dispatch(toggleDriverBlockStatus(driver._id)),
          },
        ]
      );
    },
    []
  );

  const renderDriver = useCallback(
    ({ item }) => (
      <DriverCard
        driver={item}
        onToggleBlock={handleToggleBlock}
        actionLoading={actionLoading}
      />
    ),
    [actionLoading, handleToggleBlock]
  );

  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Driver Management</Text>
          <Text style={styles.headerSub}>
            {all.length} driver{all.length !== 1 ? 's' : ''} registered
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('RegisterDriver')}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Summary bar ── */}
      {!loading && <SummaryBar all={all} />}

      {/* ── Search ── */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, vehicle no…"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter tabs ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const count =
            f.id === 'all'     ? all.length
            : f.id === 'online'  ? all.filter((d) => d.isAvailable && !d.isBlocked).length
            : f.id === 'offline' ? all.filter((d) => !d.isAvailable && !d.isBlocked).length
            : all.filter((d) => d.isBlocked).length;

          const isActive = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(f.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading drivers…</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          renderItem={renderDriver}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState filter={activeFilter} search={search} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
          // Performance
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header: {
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20, lineHeight: 22 },
  headerCenter: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  headerSub: { color: '#94a3b8', fontSize: 12, marginTop: 1 },
  addBtn: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryItem: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 1 },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  searchClear: { fontSize: 14, color: '#94a3b8', paddingLeft: 8 },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  filterTabActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  filterTabText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  filterTabTextActive: { color: '#fff' },
  filterBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeActive: { backgroundColor: '#ffffff30' },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  filterBadgeTextActive: { color: '#fff' },

  // List
  listContent: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardBlocked: {
    borderColor: '#fecaca',
    backgroundColor: '#fffafa',
  },

  // Avatar
  cardLeft: { marginRight: 12, alignItems: 'center', position: 'relative' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  pulseDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Card body
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  driverName: { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 6 },
  driverEmail: { fontSize: 11, color: '#64748b', marginBottom: 6 },

  // Status pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  pillOnline:  { backgroundColor: '#f0fdf4' },
  pillOffline: { backgroundColor: '#f8fafc' },
  pillBlocked: { backgroundColor: '#fef2f2' },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '700' },

  // Meta chips
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  metaChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaChipText: { fontSize: 10, color: '#475569', fontWeight: '600' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 12 },
  statItem: { fontSize: 11, color: '#64748b' },
  statBold: { fontWeight: '700', color: '#334155' },

  // Action button
  actionBtn: {
    width: 54,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    alignSelf: 'center',
  },
  actionBtnBlock:   { backgroundColor: '#1a1a2e' },
  actionBtnUnblock: { backgroundColor: '#22c55e' },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { color: '#fff', fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 14 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
});

export default AdminDriversScreen;