import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const StatCard = ({ icon, label, value, color, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderLeftColor: color }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    width: 110,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  icon:  { fontSize: 22, marginBottom: 8 },
  value: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 2 },
  label: { fontSize: 11, color: '#64748b', fontWeight: '500' },
});

export default StatCard;
