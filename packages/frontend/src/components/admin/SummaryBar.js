import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
    <View style={styles.bar}>
      {items.map((item) => (
        <View key={item.label} style={[styles.item, { backgroundColor: item.bg }]}>
          <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  item: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 1 },
});

export default SummaryBar;
