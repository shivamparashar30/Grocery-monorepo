import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const QuickAction = ({ icon, label, onPress, color }) => (
  <TouchableOpacity
    style={[styles.wrap, { backgroundColor: color + '15' }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconWrap, { backgroundColor: color }]}>
      <Text style={styles.emoji}>{icon}</Text>
    </View>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    width: '30.5%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: { fontSize: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center' },
});

export default QuickAction;
