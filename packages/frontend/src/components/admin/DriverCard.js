import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import StatusPill from './StatusPill';

const VEHICLE_ICONS = {
  bike:    '🏍️',
  scooter: '🛵',
  car:     '🚗',
  van:     '🚐',
};

const DriverCard = ({ driver, onToggleBlock, actionLoading }) => {
  const isActing    = actionLoading === driver._id;
  const vehicleIcon = VEHICLE_ICONS[driver.vehicleType] || '🚗';
  const initials    = (driver.name || 'D')
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const avatarBg   = driver.isBlocked ? '#fecaca' : driver.isAvailable ? '#bbf7d0' : '#e2e8f0';
  const avatarText = driver.isBlocked ? '#dc2626' : driver.isAvailable ? '#16a34a' : '#475569';

  return (
    <View style={[styles.card, driver.isBlocked && styles.cardBlocked]}>
      {/* Avatar */}
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={[styles.avatarText, { color: avatarText }]}>{initials}</Text>
        </View>
        {driver.isAvailable && !driver.isBlocked && <View style={styles.pulseDot} />}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.name} numberOfLines={1}>{driver.name}</Text>
          <StatusPill isAvailable={driver.isAvailable} isBlocked={driver.isBlocked} />
        </View>
        <Text style={styles.email} numberOfLines={1}>{driver.email}</Text>

        <View style={styles.metaRow}>
          {driver.vehicleType && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{vehicleIcon} {driver.vehicleType}</Text>
            </View>
          )}
          {driver.vehicleNumber && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>🔢 {driver.vehicleNumber}</Text>
            </View>
          )}
          {driver.phone && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>📱 {driver.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            📦 <Text style={styles.statBold}>{driver.totalDeliveries ?? 0}</Text> deliveries
          </Text>
          <Text style={styles.stat}>
            ⭐ <Text style={styles.statBold}>{driver.driverRating ?? 0}</Text> rating
          </Text>
        </View>
      </View>

      {/* Block / Unblock */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          driver.isBlocked ? styles.btnUnblock : styles.btnBlock,
          isActing && styles.btnDisabled,
        ]}
        onPress={() => onToggleBlock(driver)}
        disabled={isActing}
        activeOpacity={0.75}
      >
        {isActing
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.actionBtnText}>
              {driver.isBlocked ? '✓\nUnblock' : '✕\nBlock'}
            </Text>
        }
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
  cardBlocked: { borderColor: '#fecaca', backgroundColor: '#fffafa' },
  cardLeft:    { marginRight: 12, alignItems: 'center', position: 'relative' },
  avatar: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  pulseDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff',
  },
  cardBody:  { flex: 1 },
  cardRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name:      { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 6 },
  email:     { fontSize: 11, color: '#64748b', marginBottom: 6 },
  metaRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  chip:      { backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  chipText:  { fontSize: 10, color: '#475569', fontWeight: '600' },
  statsRow:  { flexDirection: 'row', gap: 12 },
  stat:      { fontSize: 11, color: '#64748b' },
  statBold:  { fontWeight: '700', color: '#334155' },
  actionBtn: {
    width: 54, paddingVertical: 8, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 10, alignSelf: 'center',
  },
  btnBlock:    { backgroundColor: '#1a1a2e' },
  btnUnblock:  { backgroundColor: '#22c55e' },
  btnDisabled: { opacity: 0.5 },
  actionBtnText: { color: '#fff', fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 14 },
});

export default DriverCard;
