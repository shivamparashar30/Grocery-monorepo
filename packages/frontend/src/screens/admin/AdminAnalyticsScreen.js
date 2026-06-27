import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';

const RANGES = ['Today', 'This Week', 'This Month'];

const METRICS = [
  { label: 'Total Revenue',   value: '₹84,200', change: '+12%',  color: '#22c55e', icon: '💰' },
  { label: 'Orders',          value: '319',      change: '+8%',   color: '#3b82f6', icon: '📦' },
  { label: 'New Users',       value: '47',       change: '+23%',  color: '#8b5cf6', icon: '👥' },
  { label: 'Avg Order Value', value: '₹264',     change: '-2%',   color: '#f59e0b', icon: '🛒' },
];

const TOP_PRODUCTS = [
  { rank: 1, name: 'Lays Classic',    sold: 142, revenue: '₹2,840' },
  { rank: 2, name: 'Amul Milk 1L',    sold: 120, revenue: '₹7,200' },
  { rank: 3, name: 'Coca Cola 500ml', sold: 98,  revenue: '₹3,920' },
  { rank: 4, name: 'Kurkure Masala',  sold: 87,  revenue: '₹1,740' },
  { rank: 5, name: 'Sprite 2L',       sold: 65,  revenue: '₹5,850' },
];

const BAR_DATA = [
  { day: 'Mon', value: 60  },
  { day: 'Tue', value: 85  },
  { day: 'Wed', value: 45  },
  { day: 'Thu', value: 90  },
  { day: 'Fri', value: 100 },
  { day: 'Sat', value: 72  },
  { day: 'Sun', value: 55  },
];

const AdminAnalyticsScreen = ({ navigation }) => {
  const [activeRange, setActiveRange] = useState('This Week');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Range selector */}
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeTab, activeRange === r && styles.rangeTabActive]}
              onPress={() => setActiveRange(r)}
            >
              <Text style={[styles.rangeText, activeRange === r && styles.rangeTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metric cards */}
        <View style={styles.metricsGrid}>
          {METRICS.map((m) => (
            <View key={m.label} style={styles.metricCard}>
              <Text style={styles.metricIcon}>{m.icon}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={[
                styles.metricChange,
                { color: m.change.startsWith('+') ? '#22c55e' : '#ef4444' },
              ]}>
                {m.change}
              </Text>
            </View>
          ))}
        </View>

        {/* Simple bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders This Week</Text>
          <View style={styles.barChart}>
            {BAR_DATA.map((b) => (
              <View key={b.day} style={styles.barItem}>
                <Text style={styles.barValue}>{b.value}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${b.value}%` }]} />
                </View>
                <Text style={styles.barLabel}>{b.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Products</Text>
          <View style={styles.tableCard}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 0.3 }]}>#</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Product</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Sold</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Revenue</Text>
            </View>
            {TOP_PRODUCTS.map((p) => (
              <View key={p.rank} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.3, color: '#6366f1', fontWeight: '800' }]}>
                  {p.rank}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.tableCell}>{p.sold}</Text>
                <Text style={[styles.tableCell, { fontWeight: '700', color: '#1a1a2e' }]}>
                  {p.revenue}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
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
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rangeTab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#fff', alignItems: 'center',
  },
  rangeTabActive:  { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  rangeText:       { fontSize: 12, fontWeight: '600', color: '#64748b' },
  rangeTextActive: { color: '#fff' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: {
    width: '47.5%', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  metricIcon:   { fontSize: 22, marginBottom: 8 },
  metricValue:  { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  metricLabel:  { fontSize: 11, color: '#64748b', marginBottom: 4 },
  metricChange: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 10 },
  barChart: {
    flexDirection: 'row', alignItems: 'flex-end',
    height: 120, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, gap: 6,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  barItem:  { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 9, color: '#64748b', marginBottom: 3 },
  barTrack: { width: '70%', height: '80%', backgroundColor: '#f1f5f9', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill:  { width: '100%', backgroundColor: '#6366f1', borderRadius: 4 },
  barLabel: { fontSize: 9, color: '#64748b', marginTop: 4, fontWeight: '600' },
  tableCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden',
  },
  tableHeader: { backgroundColor: '#f8fafc' },
  tableRow:    { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableCell:   { flex: 0.7, fontSize: 12, color: '#334155' },
  tableCellHeader: { fontWeight: '700', color: '#64748b', fontSize: 11 },
});

export default AdminAnalyticsScreen;
