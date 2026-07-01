import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Switch, ActivityIndicator, Alert,
  RefreshControl, Dimensions, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { clearUserData } from '../../store/slices/userSlice';
import {
  toggleAvailability, seedAvailability, clearDriverError,
} from '../../store/slices/driverSlice';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../../context/SocketContext';
import { BASE_URL } from '../../config/apiconfig';

const { width } = Dimensions.get('window');

const STATUS_COLORS = {
  assigned:          { bg: '#3B82F620', color: '#3B82F6', label: 'Pickup', icon: 'arrow-down-circle' },
  collecting:        { bg: '#6366F120', color: '#6366F1', label: 'Collecting', icon: 'cart' },
  'picked-up':       { bg: '#8B5CF620', color: '#8B5CF6', label: 'Picked Up', icon: 'bag-check' },
  'out-for-delivery': { bg: '#10B98120', color: '#10B981', label: 'En Route', icon: 'bicycle' },
  arrived:           { bg: '#EF444420', color: '#EF4444', label: 'Arrived', icon: 'location' },
  pending:           { bg: '#F59E0B20', color: '#F59E0B', label: 'Pending', icon: 'time' },
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getTimeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

const DriverHomescreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data: user } = useSelector((state) => state.user);
  const { isAvailable, availabilityLoading, error } = useSelector((state) => state.driver);
  const [deliveries, setDeliveries] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const socket = useSocket();

  // Pulse animation for online indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isAvailable) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isAvailable]);

  useEffect(() => {
    if (user?.isAvailable !== undefined) {
      dispatch(seedAvailability(user.isAvailable));
    }
  }, [user?.isAvailable]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => dispatch(clearDriverError()) },
      ]);
    }
  }, [error]);

  const fetchDeliveries = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/deliveries/my-deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDeliveries(data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  const fetchAvailableOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/deliveries/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAvailableOrders(data.data || []);
    } catch {}
  }, []);

  const fetchTodayEarnings = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/earnings/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTodayEarnings(data.data?.todayTotal || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchDeliveries();
    fetchAvailableOrders();
    fetchTodayEarnings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
      fetchAvailableOrders();
      fetchTodayEarnings();
    }, [])
  );

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;
    const unsub1 = socket.on('delivery:available', () => {
      fetchAvailableOrders();
    });
    const unsub2 = socket.on('delivery:assigned', (data) => {
      // Remove from available list if another rider took it
      setAvailableOrders((prev) => prev.filter((o) => o._id !== data.deliveryId));
      fetchDeliveries();
    });
    const unsub3 = socket.on('delivery:assigned-to-you', () => {
      fetchDeliveries();
      fetchAvailableOrders();
    });
    const unsub4 = socket.on('delivery:status-updated', () => {
      fetchDeliveries();
    });
    const unsub5 = socket.on('earnings:new', (data) => {
      if (data.earning) {
        setTodayEarnings((prev) => prev + (data.earning.totalEarning || 0));
      }
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, [socket]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDeliveries(), fetchAvailableOrders(), fetchTodayEarnings()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await dispatch(logoutUser());
          dispatch(clearUserData());
        },
      },
    ]);
  };

  const handleToggleAvailability = () => {
    if (availabilityLoading) return;
    dispatch(toggleAvailability());
  };

  const handleAcceptOrder = (deliveryId) => {
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
              setAvailableOrders((prev) => prev.filter((o) => o._id !== deliveryId));
              fetchDeliveries();
              Alert.alert('Accepted!', 'You have been assigned this delivery.', [
                { text: 'View', onPress: () => navigation.navigate('DriverDeliveryDetail', { deliveryId }) },
              ]);
            } else {
              Alert.alert('Unavailable', data.message || 'This delivery has already been taken.');
              fetchAvailableOrders();
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

  const activeDeliveries = deliveries.filter(d =>
    ['assigned', 'collecting', 'picked-up', 'out-for-delivery', 'arrived'].includes(d.status)
  );
  const completedToday = deliveries.filter(d => {
    if (d.status !== 'delivered') return false;
    const today = new Date().toDateString();
    return new Date(d.actualDeliveryTime || d.updatedAt).toDateString() === today;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ScrollView
        style={{ flex: 1, backgroundColor: '#F1F5F9' }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Gradient Header */}
        <LinearGradient colors={['#0F172A', '#1E3A5F']} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.profileBtn}>
              <Icon name="person-circle-outline" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {(user?.vehicleType || user?.vehicleNumber) && (
            <View style={styles.vehiclePill}>
              <Icon name="car-sport" size={14} color="#60A5FA" />
              <Text style={styles.vehiclePillText}>
                {user.vehicleType ? user.vehicleType.toUpperCase() : ''}
                {user.vehicleNumber ? ` · ${user.vehicleNumber}` : ''}
              </Text>
            </View>
          )}

          {/* Online/Offline Toggle */}
          <View style={[styles.toggleCard, isAvailable ? styles.toggleOnline : styles.toggleOffline]}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleStatusRow}>
                {isAvailable && (
                  <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
                )}
                <View style={[styles.statusDot, isAvailable ? styles.dotOnline : styles.dotOffline]} />
                <Text style={[styles.toggleTitle, isAvailable ? { color: '#059669' } : { color: '#DC2626' }]}>
                  {isAvailable ? 'Online' : 'Offline'}
                </Text>
              </View>
              <Text style={styles.toggleSub}>
                {availabilityLoading ? 'Updating...'
                  : isAvailable ? 'Accepting deliveries' : 'Tap to go online'}
              </Text>
            </View>
            {availabilityLoading ? (
              <ActivityIndicator size="small" color={isAvailable ? '#059669' : '#94A3B8'} />
            ) : (
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                disabled={availabilityLoading}
                trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                thumbColor={isAvailable ? '#059669' : '#94A3B8'}
                style={{ transform: [{ scaleX: 1.15 }, { scaleY: 1.15 }] }}
              />
            )}
          </View>
        </LinearGradient>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F615' }]}>
              <Icon name="bicycle" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{activeDeliveries.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98115' }]}>
              <Icon name="checkmark-done" size={18} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{completedToday.length}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
              <Icon name="star" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{user?.driverRating || '--'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#8B5CF615' }]}>
              <Icon name="wallet" size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{todayEarnings > 0 ? todayEarnings : '0'}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Offline Banner */}
          {!isAvailable && activeDeliveries.length === 0 && (
            <View style={styles.offlineBanner}>
              <View style={styles.offlineBannerIcon}>
                <Icon name="wifi-outline" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.offlineBannerTitle}>You're Offline</Text>
                <Text style={styles.offlineBannerSub}>
                  Toggle the switch above to start receiving delivery requests
                </Text>
              </View>
            </View>
          )}

          {/* Available Orders — inline list */}
          {isAvailable && availableOrders.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Icon name="flash" size={16} color="#059669" />
                  <Text style={styles.sectionTitle}>Available Orders</Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: '#059669' }]}>
                  <Text style={styles.countBadgeText}>{availableOrders.length}</Text>
                </View>
              </View>

              {availableOrders.map((item) => {
                const order = item.order;
                if (!order) return null;
                const address = order.shippingAddress;
                const itemCount = order.orderItems?.length || 0;

                return (
                  <View key={item._id} style={[styles.availableCard]}>
                    <View style={[styles.cardStrip, { backgroundColor: '#059669' }]} />
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.orderId}>#{item._id?.slice(-6).toUpperCase()}</Text>
                            <View style={styles.newBadge}>
                              <Text style={styles.newBadgeText}>NEW</Text>
                            </View>
                          </View>
                          {order.user?.name && (
                            <Text style={styles.customerName}>{order.user.name}</Text>
                          )}
                        </View>
                        <View>
                          <Text style={styles.orderAmount}>Rs. {order.totalPrice?.toFixed(0) || 0}</Text>
                          <Text style={styles.timeAgo}>{getTimeAgo(order.createdAt)}</Text>
                        </View>
                      </View>

                      <View style={styles.availableInfoRow}>
                        <View style={styles.infoChip}>
                          <Icon name="bag-outline" size={12} color="#64748B" />
                          <Text style={styles.infoChipText}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
                        </View>
                        {address?.city && (
                          <View style={styles.infoChip}>
                            <Icon name="location-outline" size={12} color="#EF4444" />
                            <Text style={styles.infoChipText} numberOfLines={1}>{address.city}</Text>
                          </View>
                        )}
                      </View>

                      {address?.address && (
                        <View style={styles.addressRow}>
                          <View style={styles.addressDot} />
                          <Text style={styles.addressText} numberOfLines={2}>
                            {address.address}{address.city ? `, ${address.city}` : ''}
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.acceptBtnWrap}
                        onPress={() => handleAcceptOrder(item._id)}
                        disabled={accepting === item._id}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#059669', '#10B981']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={styles.acceptBtnGradient}
                        >
                          {accepting === item._id ? (
                            <ActivityIndicator color="#FFF" size="small" />
                          ) : (
                            <>
                              <Icon name="checkmark-circle" size={18} color="#FFF" />
                              <Text style={styles.acceptBtnText}>Accept Delivery</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* Active Deliveries */}
          <View style={[styles.sectionHeader, isAvailable && availableOrders.length > 0 && { marginTop: 24 }]}>
            <View style={styles.sectionHeaderLeft}>
              <Icon name="flash" size={16} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Active Deliveries</Text>
            </View>
            {activeDeliveries.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{activeDeliveries.length}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading deliveries...</Text>
            </View>
          ) : activeDeliveries.length > 0 ? (
            activeDeliveries.map((delivery) => {
              const statusInfo = STATUS_COLORS[delivery.status] || STATUS_COLORS.pending;
              const itemCount = delivery.order?.orderItems?.length || 0;
              const address = delivery.order?.shippingAddress;
              const customerName = delivery.order?.user?.name;

              return (
                <TouchableOpacity
                  key={delivery._id}
                  style={styles.deliveryCard}
                  onPress={() => navigation.navigate('DriverDeliveryDetail', { deliveryId: delivery._id })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.cardStrip, { backgroundColor: statusInfo.color }]} />

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderId}>#{delivery._id?.slice(-6).toUpperCase()}</Text>
                        {customerName && (
                          <Text style={styles.customerName}>{customerName}</Text>
                        )}
                      </View>
                      <View style={[styles.statusChip, { backgroundColor: statusInfo.bg }]}>
                        <Icon name={statusInfo.icon} size={12} color={statusInfo.color} />
                        <Text style={[styles.statusChipText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    {address && (
                      <View style={styles.addressRow}>
                        <View style={styles.addressDot} />
                        <Text style={styles.addressText} numberOfLines={2}>
                          {address.address || ''}{address.city ? `, ${address.city}` : ''}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <View style={styles.footerInfo}>
                        <Icon name="bag-outline" size={13} color="#94A3B8" />
                        <Text style={styles.footerInfoText}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={styles.orderAmount}>
                        Rs. {delivery.order?.totalPrice?.toFixed(0) || 0}
                      </Text>
                      <View style={styles.goArrow}>
                        <Icon name="arrow-forward" size={14} color="#3B82F6" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="cube-outline" size={32} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>No active deliveries</Text>
              <Text style={styles.emptySub}>
                {isAvailable
                  ? 'You\'ll be notified when new orders are assigned'
                  : 'Go online to receive delivery assignments'
                }
              </Text>
            </View>
          )}

          {/* Completed Today */}
          {completedToday.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <View style={styles.sectionHeaderLeft}>
                  <Icon name="checkmark-done-circle" size={16} color="#10B981" />
                  <Text style={styles.sectionTitle}>Completed Today</Text>
                </View>
                <Text style={styles.completedCount}>{completedToday.length}</Text>
              </View>

              {completedToday.slice(0, 5).map((delivery) => (
                <TouchableOpacity
                  key={delivery._id}
                  style={styles.completedCard}
                  onPress={() => navigation.navigate('DriverDeliveryDetail', { deliveryId: delivery._id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.completedIcon}>
                    <Icon name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedId}>#{delivery._id?.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.completedMeta}>
                      {delivery.order?.orderItems?.length || 0} items
                    </Text>
                  </View>
                  <Text style={styles.completedAmount}>
                    Rs. {delivery.order?.totalPrice?.toFixed(0) || 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  greetingText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  driverName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  profileBtn: { padding: 6 },

  vehiclePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1E3A5F', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
    marginBottom: 16, borderWidth: 1, borderColor: '#2D4A6F',
  },
  vehiclePillText: { color: '#60A5FA', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Toggle
  toggleCard: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  toggleOnline: { backgroundColor: '#064E3B', borderWidth: 1, borderColor: '#065F46' },
  toggleOffline: { backgroundColor: '#1C1917', borderWidth: 1, borderColor: '#292524' },
  toggleLeft: { flex: 1, marginRight: 12 },
  toggleStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pulseDot: {
    position: 'absolute', left: -2, width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#10B98130',
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotOnline: { backgroundColor: '#10B981' },
  dotOffline: { backgroundColor: '#EF4444' },
  toggleTitle: { fontSize: 16, fontWeight: '800' },
  toggleSub: { fontSize: 12, color: '#9CA3AF' },

  // Stats
  statsStrip: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginTop: -1, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  statDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 20 },

  // Offline banner
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  offlineBannerIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center',
  },
  offlineBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  offlineBannerSub: { fontSize: 12, color: '#A16207', marginTop: 2 },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  countBadge: {
    backgroundColor: '#3B82F6', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // Available order cards
  availableCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 10,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#D1FAE5',
  },
  newBadge: {
    backgroundColor: '#059669', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  newBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  timeAgo: { fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 2 },
  availableInfoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F8FAFC', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  infoChipText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  acceptBtnWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  acceptBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 8,
  },
  acceptBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Loading
  loadingCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 30,
    alignItems: 'center', gap: 10,
  },
  loadingText: { color: '#94A3B8', fontSize: 13 },

  // Delivery Cards
  deliveryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 10,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardStrip: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  orderId: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  customerName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusChipText: { fontSize: 11, fontWeight: '700' },

  addressRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginBottom: 10, paddingLeft: 2,
  },
  addressDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444',
    marginTop: 4, borderWidth: 2, borderColor: '#FEE2E2',
  },
  addressText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  footerInfoText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  orderAmount: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginRight: 10 },
  goArrow: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },

  // Empty state
  emptyState: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 40, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center', lineHeight: 18 },

  // Completed cards
  completedCount: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  completedCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  completedIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#DCFCE7',
    justifyContent: 'center', alignItems: 'center',
  },
  completedId: { fontSize: 13, fontWeight: '700', color: '#334155' },
  completedMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  completedAmount: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
});

export default DriverHomescreen;
