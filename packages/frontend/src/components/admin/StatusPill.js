import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusPill = ({ isAvailable, isBlocked }) => {
  if (isBlocked) {
    return (
      <View style={[styles.pill, styles.pillBlocked]}>
        <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
        <Text style={[styles.text, { color: '#ef4444' }]}>Blocked</Text>
      </View>
    );
  }
  if (isAvailable) {
    return (
      <View style={[styles.pill, styles.pillOnline]}>
        <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
        <Text style={[styles.text, { color: '#22c55e' }]}>Online</Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, styles.pillOffline]}>
      <View style={[styles.dot, { backgroundColor: '#94a3b8' }]} />
      <Text style={[styles.text, { color: '#94a3b8' }]}>Offline</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '700' },
});

export default StatusPill;
