import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllDrivers,
  toggleDriverBlockStatus,
  clearDriversError,
} from '../../store/slices/driversSlice';
import Icon from 'react-native-vector-icons/Ionicons';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online' },
  { id: 'offline', label: 'Offline' },
  { id: 'blocked', label: 'Blocked' },
];

const VEHICLE_ICONS = {
  bike: 'bicycle',
  scooter: 'bicycle',
  car: 'car-sport',
  van: 'bus',
};

// ── Status Pill ──────────────────────────────────────────────────────────────
const StatusPill = ({ isAvailable, isBlocked }) => {
  const config = isBlocked
    ? { color: '#DC2626', bg: '#FEE2E2', label: 'Blocked' }
    : isAvailable
    ? { color: '#16A34A', bg: '#DCFCE7', label: 'Online' }
    : { color: '#94A3B8', bg: '#F1F5F9', label: 'Offline' };

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: config.color }]} />
      <Text style={[styles.pillText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

// ── Driver Card ──────────────────────────────────────────────────────────────
const DriverCard = ({ driver, onToggleBlock, actionLoading }) => {
  const isActing = actionLoading === driver._id;
  const vehicleIcon = VEHICLE_ICONS[driver.vehicleType] || 'car-sport';
  const initials = (driver.name || 'D')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarBg = driver.isBlocked
    ? '#FEE2E2'
    : driver.isAvailable
    ? '#DCFCE7'
    : '#F1F5F9';

  const avatarColor = driver.isBlocked
    ? '#DC2626'
    : driver.isAvailable
    ? '#16A34A'
    : '#64748B';

  return (
    <View style={[styles.card, driver.isBlocked && styles.cardBlocked]}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
            {driver.isAvailable && !driver.isBlocked && <View style={styles.onlineDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName} numberOfLines={1}>{driver.name}</Text>
            <Text style={styles.driverEmail} numberOfLines={1}>{driver.email}</Text>
          </View>
        </View>
        <StatusPill isAvailable={driver.isAvailable} isBlocked={driver.isBlocked} />
      </View>

      <View style={styles.metaRow}>
        {driver.vehicleType && (
          <View style={styles.metaChip}>
            <Icon name={vehicleIcon} size={12} color="#6C5CE7" />
            <Text style={styles.metaText}>{driver.vehicleType}</Text>
          </View>
        )}
        {driver.vehicleNumber && (
          <View style={styles.metaChip}>
            <Icon name="card-outline" size={12} color="#6C5CE7" />
            <Text style={styles.metaText}>{driver.vehicleNumber}</Text>
          </View>
        )}
        {driver.phone && (
          <View style={styles.metaChip}>
            <Icon name="call-outline" size={12} color="#6C5CE7" />
            <Text style={styles.metaText}>{driver.phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Icon name="cube-outline" size={14} color="#64748B" />
            <Text style={styles.statValue}>{driver.totalDeliveries ?? 0}</Text>
            <Text style={styles.statLabel}>deliveries</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={14} color="#F59E0B" />
            <Text style={styles.statValue}>{driver.driverRating ?? 0}</Text>
            <Text style={styles.statLabel}>rating</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.blockBtn,
            driver.isBlocked ? styles.unblockBtn : styles.blockBtnDanger,
            isActing && { opacity: 0.5 },
          ]}
          onPress={() => onToggleBlock(driver)}
          disabled={isActing}
          activeOpacity={0.7}
        >
          {isActing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon
                name={driver.isBlocked ? 'checkmark-circle' : 'ban'}
                size={14}
                color="#fff"
              />
              <Text style={styles.blockBtnText}>
                {driver.isBlocked ? 'Unblock' : 'Block'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminDriversScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { all, loading, refreshing, error, actionLoading } = useSelector(
    (s) => s.drivers
  );

  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchAllDrivers()); }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => dispatch(clearDriversError()) },
      ]);
    }
  }, [error]);

  const onRefresh = useCallback(() => {
    dispatch(fetchAllDrivers({ refresh: true }));
  }, []);

  const displayed = useMemo(() => {
    let list = all;
    if (activeFilter === 'online') list = list.filter((d) => d.isAvailable && !d.isBlocked);
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

  const handleToggleBlock = useCallback((driver) => {
    const action = driver.isBlocked ? 'unblock' : 'block';
    Alert.alert(
      `${driver.isBlocked ? 'Unblock' : 'Block'} Rider`,
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
  }, []);

  const counts = useMemo(() => ({
    all: all.length,
    online: all.filter((d) => d.isAvailable && !d.isBlocked).length,
    offline: all.filter((d) => !d.isAvailable && !d.isBlocked).length,
    blocked: all.filter((d) => d.isBlocked).length,
  }), [all]);

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Riders</Text>
          <Text style={styles.headerSub}>{all.length} registered</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('RegisterDriver')}
          activeOpacity={0.7}
        >
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Total', value: counts.all, color: '#6C5CE7', bg: '#EDE9FE' },
          { label: 'Online', value: counts.online, color: '#16A34A', bg: '#DCFCE7' },
          { label: 'Offline', value: counts.offline, color: '#94A3B8', bg: '#F1F5F9' },
          { label: 'Blocked', value: counts.blocked, color: '#DC2626', bg: '#FEE2E2' },
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
          placeholder="Search riders..."
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
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, isActive && { color: '#fff' }]}>
                  {counts[f.id]}
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
          <DriverCard
            driver={item}
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
            <Icon name="bicycle-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {search
                ? 'No riders match your search'
                : activeFilter === 'online'
                ? 'No riders online'
                : activeFilter === 'blocked'
                ? 'No blocked riders'
                : 'No riders registered'}
            </Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search' : 'Pull down to refresh'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  filterText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
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
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },

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
  cardBlocked: { borderWidth: 1, borderColor: '#FECACA' },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },

  driverName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  driverEmail: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  // Status pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '700' },

  // Meta
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  metaText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  // Card bottom
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statRow: { flexDirection: 'row', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#94A3B8' },

  blockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  blockBtnDanger: { backgroundColor: '#1E293B' },
  unblockBtn: { backgroundColor: '#22C55E' },
  blockBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
});

export default AdminDriversScreen;
