import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSocket } from '../../context/SocketContext';
import { BASE_URL } from '../../config/apiconfig';

const AvailableOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const socket = useSocket();

  const fetchAvailable = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/deliveries/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchAvailable(); }, []));

  // Real-time: new available order
  useEffect(() => {
    if (!socket) return;
    const unsub1 = socket.on('delivery:available', (data) => {
      fetchAvailable();
    });
    // Remove order when another rider accepts
    const unsub2 = socket.on('delivery:assigned', (data) => {
      setOrders((prev) => prev.filter((o) => o._id !== data.deliveryId));
    });
    return () => { unsub1(); unsub2(); };
  }, [socket]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAvailable();
    setRefreshing(false);
  };

  const handleAccept = async (deliveryId) => {
    Alert.alert('Accept Delivery', 'Are you sure you want to accept this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          setAccepting(deliveryId);
          try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/deliveries/${deliveryId}/accept`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await res.json();
            if (data.success) {
              Alert.alert('Accepted!', 'You have been assigned this delivery.', [
                { text: 'View', onPress: () => navigation.navigate('DriverDeliveryDetail', { deliveryId }) },
              ]);
              setOrders((prev) => prev.filter((o) => o._id !== deliveryId));
            } else {
              Alert.alert('Unavailable', data.message || 'This delivery has already been taken.');
            }
          } catch {
            Alert.alert('Error', 'Failed to accept delivery');
          } finally {
            setAccepting(null);
          }
        },
      },
    ]);
  };

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const renderOrder = ({ item }) => {
    const order = item.order;
    if (!order) return null;
    const address = order.shippingAddress;
    const itemCount = order.orderItems?.length || 0;

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.orderId}>#{item._id?.slice(-6).toUpperCase()}</Text>
            <Text style={s.timeText}>{getTimeAgo(order.createdAt)}</Text>
          </View>
          <Text style={s.amount}>Rs. {order.totalPrice?.toFixed(0) || 0}</Text>
        </View>

        <View style={s.divider} />

        <View style={s.infoSection}>
          {order.user?.name && (
            <View style={s.infoRow}>
              <Icon name="person-outline" size={14} color="#64748B" />
              <Text style={s.infoText}>{order.user.name}</Text>
            </View>
          )}
          {address && (
            <View style={s.infoRow}>
              <Icon name="location-outline" size={14} color="#EF4444" />
              <Text style={s.infoText} numberOfLines={2}>
                {address.address || ''}{address.city ? `, ${address.city}` : ''}
              </Text>
            </View>
          )}
          <View style={s.infoRow}>
            <Icon name="bag-outline" size={14} color="#64748B" />
            <Text style={s.infoText}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.acceptBtn}
          onPress={() => handleAccept(item._id)}
          disabled={accepting === item._id}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#059669', '#10B981']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.acceptBtnGradient}
          >
            {accepting === item._id ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Icon name="checkmark-circle" size={18} color="#FFF" />
                <Text style={s.acceptBtnText}>Accept Delivery</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1F5F9" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Available Orders</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{orders.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon}>
                <Icon name="cube-outline" size={36} color="#CBD5E1" />
              </View>
              <Text style={s.emptyTitle}>No available orders</Text>
              <Text style={s.emptySub}>
                New orders will appear here when confirmed by the store
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#0F172A' },
  countBadge: {
    backgroundColor: '#3B82F6', borderRadius: 12,
    minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 8,
  },
  countText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  list: { padding: 16, paddingBottom: 30 },

  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderId: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  timeText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  amount: { fontSize: 20, fontWeight: '800', color: '#0F172A' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  infoSection: { gap: 8, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { flex: 1, fontSize: 13, color: '#475569' },

  acceptBtn: { borderRadius: 14, overflow: 'hidden' },
  acceptBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  acceptBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  emptyWrap: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});

export default AvailableOrdersScreen;
