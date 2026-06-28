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
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/apiconfig';

const NOTIF_API = `${BASE_URL}/notifications`;

const TYPE_META = {
  order:    { icon: 'receipt-outline',   color: '#3B82F6', bg: '#DBEAFE' },
  delivery: { icon: 'car-outline',       color: '#06B6D4', bg: '#CFFAFE' },
  payment:  { icon: 'wallet-outline',    color: '#22C55E', bg: '#DCFCE7' },
  offer:    { icon: 'pricetag-outline',  color: '#F59E0B', bg: '#FEF3C7' },
  product:  { icon: 'cube-outline',      color: '#8B5CF6', bg: '#EDE9FE' },
  system:   { icon: 'settings-outline',  color: '#64748B', bg: '#F1F5F9' },
  general:  { icon: 'notifications-outline', color: '#6C5CE7', bg: '#F5F3FF' },
};

const PRIORITY_COLOR = {
  high:   '#EF4444',
  medium: '#F59E0B',
  low:    '#94A3B8',
};

const BROADCAST_TYPES = ['general', 'offer', 'system', 'product'];

const getTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

// ── Notification Card ────────────────────────────────────────────────────────
const NotifCard = ({ notif, onMarkRead, onDelete }) => {
  const meta = TYPE_META[notif.type] || TYPE_META.general;
  return (
    <TouchableOpacity
      style={[styles.card, !notif.isRead && styles.cardUnread]}
      onPress={() => !notif.isRead && onMarkRead(notif._id)}
      activeOpacity={0.7}
    >
      <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
        <Icon name={meta.icon} size={18} color={meta.color} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={styles.notifTime}>{getTimeAgo(notif.createdAt)}</Text>
        </View>
        <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.typePill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.typeText, { color: meta.color }]}>{notif.type}</Text>
          </View>
          {notif.priority === 'high' && (
            <View style={styles.priorityPill}>
              <Icon name="alert-circle" size={10} color="#EF4444" />
              <Text style={styles.priorityText}>High</Text>
            </View>
          )}
          {!notif.isRead && <View style={styles.unreadDot} />}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(notif._id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="trash-outline" size={14} color="#CBD5E1" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminNotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    type: 'general',
    title: '',
    message: '',
    priority: 'medium',
  });
  const [sending, setSending] = useState(false);

  const getToken = async () => {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const headers = await getToken();
      const res = await fetch(NOTIF_API, { headers });
      const data = await res.json();
      if (data.success) setNotifications(data.data || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      const headers = await getToken();
      await fetch(`${NOTIF_API}/${id}/read`, { method: 'PUT', headers });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const headers = await getToken();
      await fetch(`${NOTIF_API}/read-all`, { method: 'PUT', headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  }, []);

  const deleteNotif = useCallback(async (id) => {
    try {
      const headers = await getToken();
      await fetch(`${NOTIF_API}/${id}`, { method: 'DELETE', headers });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete notification');
    }
  }, []);

  const handleBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      Alert.alert('Error', 'Title and message are required');
      return;
    }
    try {
      setSending(true);
      const headers = await getToken();
      const res = await fetch(`${NOTIF_API}/broadcast`, {
        method: 'POST',
        headers,
        body: JSON.stringify(broadcastForm),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Sent', data.message || 'Broadcast sent!');
        setBroadcastModal(false);
        setBroadcastForm({ type: 'general', title: '', message: '', priority: 'medium' });
      } else {
        Alert.alert('Error', data.message || 'Failed to send');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to broadcast');
    } finally {
      setSending(false);
    }
  };

  const displayed = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.broadcastBtn}
          onPress={() => setBroadcastModal(true)}
        >
          <Icon name="megaphone-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter + Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.filterRow}>
          {['all', 'unread'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Icon name="checkmark-done" size={14} color="#6C5CE7" />
            <Text style={styles.markAllText}>Read all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={displayed}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotifCard notif={item} onMarkRead={markAsRead} onDelete={deleteNotif} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="notifications-off-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>
              {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
            </Text>
          </View>
        }
      />

      {/* Broadcast Modal */}
      <Modal visible={broadcastModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Broadcast Notification</Text>
            <Text style={styles.modalSub}>Send to all users</Text>

            <Text style={styles.inputLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {BROADCAST_TYPES.map((t) => {
                const meta = TYPE_META[t];
                const isSelected = broadcastForm.type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeChip,
                      isSelected && { backgroundColor: meta.color, borderColor: meta.color },
                    ]}
                    onPress={() => setBroadcastForm((f) => ({ ...f, type: t }))}
                  >
                    <Icon name={meta.icon} size={14} color={isSelected ? '#fff' : meta.color} />
                    <Text style={[styles.typeChipText, isSelected && { color: '#fff' }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={broadcastForm.title}
              onChangeText={(v) => setBroadcastForm((f) => ({ ...f, title: v }))}
              placeholder="Notification title"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={broadcastForm.message}
              onChangeText={(v) => setBroadcastForm((f) => ({ ...f, message: v }))}
              placeholder="Notification message"
              placeholderTextColor="#94A3B8"
              multiline
            />

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {['low', 'medium', 'high'].map((p) => {
                const isSelected = broadcastForm.priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityChip,
                      isSelected && { backgroundColor: PRIORITY_COLOR[p], borderColor: PRIORITY_COLOR[p] },
                    ]}
                    onPress={() => setBroadcastForm((f) => ({ ...f, priority: p }))}
                  >
                    <Text style={[styles.priorityChipText, isSelected && { color: '#fff' }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setBroadcastModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSend, sending && { opacity: 0.6 }]}
                onPress={handleBroadcast}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="send" size={14} color="#fff" />
                    <Text style={styles.modalSendText}>Broadcast</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  broadcastBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  filterTabActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: { fontSize: 12, fontWeight: '600', color: '#6C5CE7' },

  // List
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#6C5CE7',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notifTitle: { fontSize: 13, fontWeight: '600', color: '#475569', flex: 1, marginRight: 8 },
  notifTitleUnread: { fontWeight: '700', color: '#0F172A' },
  notifTime: { fontSize: 10, color: '#94A3B8' },
  notifMessage: { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  priorityText: { fontSize: 9, fontWeight: '700', color: '#EF4444' },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6C5CE7',
  },
  deleteBtn: { padding: 4, marginLeft: 4 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptySub: { fontSize: 13, color: '#94A3B8' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeRow: { marginBottom: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    marginRight: 8,
    gap: 5,
  },
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'capitalize' },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  priorityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  priorityChipText: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'capitalize' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  modalSend: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSendText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default AdminNotificationsScreen;
