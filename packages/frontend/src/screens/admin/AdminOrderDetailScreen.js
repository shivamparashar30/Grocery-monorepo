import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, RefreshControl, StyleSheet, Modal, FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/apiconfig';
import { useSocket } from '../../context/SocketContext';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_META = {
  pending:    { color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline', label: 'Pending' },
  confirmed:  { color: '#3B82F6', bg: '#DBEAFE', icon: 'checkmark-circle-outline', label: 'Confirmed' },
  processing: { color: '#8B5CF6', bg: '#EDE9FE', icon: 'construct-outline', label: 'Processing' },
  shipped:    { color: '#06B6D4', bg: '#CFFAFE', icon: 'car-outline', label: 'Shipped' },
  delivered:  { color: '#22C55E', bg: '#DCFCE7', icon: 'checkmark-done-circle-outline', label: 'Delivered' },
  cancelled:  { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline', label: 'Cancelled' },
};

const DELIVERY_STATUS_META = {
  pending:           { color: '#F59E0B', label: 'Pending' },
  assigned:          { color: '#3B82F6', label: 'Driver Assigned' },
  collecting:        { color: '#8B5CF6', label: 'Collecting Order' },
  'picked-up':       { color: '#A855F7', label: 'Picked Up' },
  'in-transit':      { color: '#06B6D4', label: 'In Transit' },
  'out-for-delivery': { color: '#2BB77D', label: 'Out for Delivery' },
  arrived:           { color: '#0EA5E9', label: 'Arrived' },
  delivered:         { color: '#22C55E', label: 'Delivered' },
  cancelled:         { color: '#EF4444', label: 'Cancelled' },
  failed:            { color: '#EF4444', label: 'Failed' },
};

const AdminOrderDetailScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [itemMods, setItemMods] = useState({});
  const [saving, setSaving] = useState(false);
  const socket = useSocket();

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const fetchOrder = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/orders/${orderId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setItemMods({});
      }
    } catch {}
  }, [orderId]);

  const fetchDelivery = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/deliveries/order/${orderId}`, { headers });
      const data = await res.json();
      if (data.success) setDelivery(data.data);
    } catch {}
  }, [orderId]);

  const fetchDrivers = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/auth/drivers`, { headers });
      const data = await res.json();
      if (data.success) setDrivers(data.data || []);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchOrder(), fetchDelivery()]);
      setLoading(false);
    })();
  }, []);

  // Socket: join order + delivery rooms for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.joinRoom('order', orderId);

    const unsub1 = socket.on('order:status-updated', (data) => {
      if (data.orderId === orderId) {
        setOrder((prev) => prev ? { ...prev, status: data.status } : prev);
      }
    });

    const unsub2 = socket.on('delivery:status-updated', (data) => {
      if (data.orderId === orderId || data.deliveryId === delivery?._id) {
        setDelivery((prev) => prev ? {
          ...prev,
          status: data.status,
          statusHistory: data.statusHistory || prev.statusHistory,
          estimatedDeliveryTime: data.estimatedDeliveryTime || prev.estimatedDeliveryTime,
        } : prev);
      }
    });

    const unsub3 = socket.on('delivery:assigned', (data) => {
      if (data.orderId === orderId) {
        fetchDelivery();
      }
    });

    const unsub4 = socket.on('order:otp-generated', (data) => {
      if (data.orderId === orderId) {
        setDelivery((prev) => prev ? {
          ...prev,
          pickupOtp: { code: data.otp, verified: false },
        } : prev);
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      socket.leaveRoom('order', orderId);
    };
  }, [socket, orderId, delivery?._id]);

  // Join delivery room once we have the delivery ID
  useEffect(() => {
    if (!socket || !delivery?._id) return;
    socket.joinRoom('delivery', delivery._id);
    return () => socket.leaveRoom('delivery', delivery._id);
  }, [socket, delivery?._id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrder(), fetchDelivery()]);
    setRefreshing(false);
  };

  const handleUpdateOrderStatus = async (status) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        fetchDelivery();
      } else {
        Alert.alert('Error', data.message || 'Failed to update');
      }
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleAcceptOrder = () => {
    const mods = Object.entries(itemMods);
    if (mods.length > 0) {
      Alert.alert(
        'Unsaved Changes',
        'You have modified items. Save changes before confirming the order.',
        [
          { text: 'Save & Confirm', onPress: () => saveModsThenConfirm() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert('Confirm Order', 'Accept and confirm this order? This will notify all active riders.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleUpdateOrderStatus('confirmed') },
      ]);
    }
  };

  const handleRejectOrder = () => {
    Alert.alert('Reject Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
              method: 'PUT', headers,
            });
            const data = await res.json();
            if (data.success) setOrder(data.data);
            else Alert.alert('Error', data.message || 'Failed');
          } catch {
            Alert.alert('Error', 'Failed to cancel order');
          }
        },
      },
    ]);
  };

  const handleAssignDriver = async (driverId) => {
    if (!delivery) return;
    setAssigning(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/deliveries/${delivery._id}/assign`, {
        method: 'PUT', headers,
        body: JSON.stringify({ driverId }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', data.message);
        setShowDriverModal(false);
        fetchDelivery();
      } else {
        Alert.alert('Error', data.message || 'Failed to assign');
      }
    } catch {
      Alert.alert('Error', 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  const openDriverModal = async () => {
    await fetchDrivers();
    setShowDriverModal(true);
  };

  const modifyItemQty = (productId, newQty) => {
    setItemMods((prev) => ({ ...prev, [productId]: { quantity: newQty, removed: false } }));
  };

  const markItemRemoved = (productId, itemName) => {
    Alert.alert('Remove Item', `Mark "${itemName}" as unavailable?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setItemMods((prev) => ({ ...prev, [productId]: { removed: true } })),
      },
    ]);
  };

  const undoRemove = (productId) => {
    setItemMods((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const saveModifications = async () => {
    const mods = Object.entries(itemMods);
    if (mods.length === 0) return;

    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const items = mods.map(([productId, mod]) => ({
        productId,
        quantity: mod.quantity || 0,
        removed: mod.removed || false,
      }));

      const res = await fetch(`${BASE_URL}/orders/${orderId}/modify-items`, {
        method: 'PUT', headers,
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setItemMods({});
        Alert.alert('Saved', 'Order items updated and customer notified.');
      } else {
        Alert.alert('Error', data.message || 'Failed to save');
      }
    } catch {
      Alert.alert('Error', 'Failed to save modifications');
    } finally {
      setSaving(false);
    }
  };

  const saveModsThenConfirm = async () => {
    const mods = Object.entries(itemMods);
    if (mods.length === 0) {
      handleUpdateOrderStatus('confirmed');
      return;
    }

    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const items = mods.map(([productId, mod]) => ({
        productId,
        quantity: mod.quantity || 0,
        removed: mod.removed || false,
      }));

      const res = await fetch(`${BASE_URL}/orders/${orderId}/modify-items`, {
        method: 'PUT', headers,
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setItemMods({});
        await handleUpdateOrderStatus('confirmed');
      } else {
        Alert.alert('Error', data.message || 'Failed to save');
      }
    } catch {
      Alert.alert('Error', 'Failed to save modifications');
    } finally {
      setSaving(false);
    }
  };

  const getNextStatus = () => {
    if (!order) return null;
    const idx = ORDER_STATUSES.indexOf(order.status);
    if (idx >= 0 && idx < ORDER_STATUSES.length - 1) return ORDER_STATUSES[idx + 1];
    return null;
  };

  const hasModifications = Object.keys(itemMods).length > 0;

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

  const meta = STATUS_META[order?.status] || STATUS_META.pending;
  const nextStatus = getNextStatus();
  const deliveryMeta = DELIVERY_STATUS_META[delivery?.status] || DELIVERY_STATUS_META.pending;
  const isPending = order?.status === 'pending';
  const isConfirmed = order?.status === 'confirmed';
  const showOtp = delivery?.pickupOtp?.code && !delivery?.pickupOtp?.verified;
  const otpVerified = delivery?.pickupOtp?.verified;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
          <Icon name="chevron-back" size={24} color="#0F172A" />
          <Text style={styles.headerTitle}>Order #{orderId?.slice(-8).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
      >
        {/* Order Status Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={[styles.pill, { backgroundColor: meta.bg }]}>
              <Icon name={meta.icon} size={14} color={meta.color} />
              <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{order?.user?.name || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{order?.user?.email || 'N/A'}</Text>
            </View>
            {order?.user?.phone && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{order.user.phone}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Items</Text>
              <Text style={styles.infoValue}>{order?.orderItems?.length || 0} items</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={[styles.infoValue, { fontWeight: '800', color: '#0F172A' }]}>
                Rs. {order?.totalPrice?.toFixed(0) || 0}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment</Text>
              <Text style={styles.infoValue}>{order?.paymentMethod || 'COD'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {order?.shippingAddress?.address || 'N/A'}, {order?.shippingAddress?.city || ''}
              </Text>
            </View>
            {order?.orderNotes ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={[styles.infoValue, { color: '#92400E' }]}>{order.orderNotes}</Text>
              </View>
            ) : null}
          </View>

          {/* Accept / Reject for pending orders */}
          {isPending && order?.status !== 'cancelled' && (
            <>
              <View style={styles.divider} />
              <View style={styles.acceptRejectRow}>
                <TouchableOpacity
                  style={[styles.rejectBtn]}
                  onPress={handleRejectOrder}
                >
                  <Icon name="close-circle" size={18} color="#EF4444" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptBtn]}
                  onPress={handleAcceptOrder}
                >
                  <Icon name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.acceptBtnText}>Accept & Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Status progression button for non-pending orders */}
          {!isPending && nextStatus && order?.status !== 'cancelled' && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: STATUS_META[nextStatus]?.color || '#6C5CE7' }]}
                onPress={() => handleUpdateOrderStatus(nextStatus)}
              >
                <Icon name="arrow-forward-circle" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>Mark as {STATUS_META[nextStatus]?.label || nextStatus}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Pickup OTP Card — shown after order is confirmed */}
        {(showOtp || otpVerified) && (
          <View style={[styles.card, { borderWidth: 1.5, borderColor: showOtp ? '#F59E0B' : '#22C55E' }]}>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon
                  name={otpVerified ? 'checkmark-shield' : 'key-outline'}
                  size={20}
                  color={otpVerified ? '#22C55E' : '#F59E0B'}
                />
                <Text style={styles.sectionTitle}>Pickup OTP</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: otpVerified ? '#DCFCE7' : '#FEF3C7' }]}>
                <Text style={[styles.pillText, { color: otpVerified ? '#22C55E' : '#92400E' }]}>
                  {otpVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>

            {showOtp && (
              <>
                <View style={styles.divider} />
                <View style={styles.otpContainer}>
                  {delivery.pickupOtp.code.split('').map((digit, i) => (
                    <View key={i} style={styles.otpDigitBox}>
                      <Text style={styles.otpDigitText}>{digit}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.otpHint}>
                  Share this OTP with the rider for order pickup verification
                </Text>
              </>
            )}

            {otpVerified && (
              <>
                <View style={styles.divider} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="checkmark-circle" size={16} color="#22C55E" />
                  <Text style={{ fontSize: 13, color: '#22C55E', fontWeight: '600' }}>
                    OTP verified — rider has collected the order
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Order Items with Stock */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {isPending && (
              <Text style={styles.reviewHint}>Review stock & adjust</Text>
            )}
          </View>
          <View style={styles.divider} />

          {order?.orderItems?.map((item, i) => {
            const productId = item.product?._id || item.product;
            const stock = item.product?.stock;
            const isOutOfStock = item.product?.isOutOfStock;
            const mod = itemMods[productId];
            const isRemoved = mod?.removed;
            const currentQty = mod?.quantity ?? item.quantity;
            const isLowStock = stock !== undefined && stock < item.quantity;

            return (
              <View
                key={i}
                style={[
                  styles.itemRow,
                  i > 0 && { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
                  isRemoved && { opacity: 0.4 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, isRemoved && styles.strikethrough]}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {currentQty} x Rs. {item.price}
                  </Text>

                  {stock !== undefined && (
                    <View style={styles.stockRow}>
                      <View style={[
                        styles.stockBadge,
                        isOutOfStock
                          ? { backgroundColor: '#FEE2E2' }
                          : isLowStock
                            ? { backgroundColor: '#FEF3C7' }
                            : { backgroundColor: '#DCFCE7' },
                      ]}>
                        <Icon
                          name={isOutOfStock ? 'alert-circle' : isLowStock ? 'warning' : 'checkmark-circle'}
                          size={10}
                          color={isOutOfStock ? '#EF4444' : isLowStock ? '#F59E0B' : '#22C55E'}
                        />
                        <Text style={[
                          styles.stockText,
                          { color: isOutOfStock ? '#EF4444' : isLowStock ? '#F59E0B' : '#22C55E' },
                        ]}>
                          {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <Text style={styles.itemTotal}>
                  Rs. {(currentQty * item.price).toFixed(0)}
                </Text>

                {isPending && !isRemoved && (
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => {
                        if (currentQty > 1) modifyItemQty(productId, currentQty - 1);
                      }}
                    >
                      <Icon name="remove" size={14} color="#64748B" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{currentQty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => {
                        const maxStock = stock || 999;
                        if (currentQty < maxStock) modifyItemQty(productId, currentQty + 1);
                      }}
                    >
                      <Icon name="add" size={14} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeItemBtn}
                      onPress={() => markItemRemoved(productId, item.name)}
                    >
                      <Icon name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}

                {isPending && isRemoved && (
                  <TouchableOpacity
                    style={styles.undoBtn}
                    onPress={() => undoRemove(productId)}
                  >
                    <Icon name="arrow-undo" size={14} color="#6C5CE7" />
                    <Text style={styles.undoBtnText}>Undo</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {isPending && hasModifications && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#6C5CE7' }]}
                onPress={saveModifications}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name="save" size={18} color="#FFF" />
                    <Text style={styles.actionBtnText}>Save Changes & Notify Customer</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={[styles.divider, { marginTop: 4 }]} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>Rs. {order?.itemsPrice?.toFixed(0) || 0}</Text>
          </View>
          {order?.taxPrice > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>Rs. {order.taxPrice.toFixed(0)}</Text>
            </View>
          )}
          {order?.shippingPrice > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>Rs. {order.shippingPrice.toFixed(0)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { marginTop: 4 }]}>
            <Text style={[styles.totalLabel, { fontWeight: '800', color: '#0F172A', fontSize: 15 }]}>Total</Text>
            <Text style={[styles.totalValue, { fontWeight: '800', color: '#0F172A', fontSize: 17 }]}>
              Rs. {order?.totalPrice?.toFixed(0) || 0}
            </Text>
          </View>
        </View>

        {/* Delivery & Driver Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <View style={[styles.pill, { backgroundColor: deliveryMeta.color + '15' }]}>
              <Text style={[styles.pillText, { color: deliveryMeta.color }]}>{deliveryMeta.label}</Text>
            </View>
          </View>

          {delivery?.trackingNumber && (
            <Text style={styles.trackingText}>Tracking: {delivery.trackingNumber}</Text>
          )}

          {delivery?.estimatedDeliveryTime && (
            <View style={styles.etaRow}>
              <Icon name="time-outline" size={14} color="#059669" />
              <Text style={styles.etaText}>
                ETA: {new Date(delivery.estimatedDeliveryTime).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Driver info or assign button */}
          {delivery?.driver ? (
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Icon name="person" size={22} color="#6C5CE7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{delivery.driver.name}</Text>
                <Text style={styles.driverInfo}>
                  {delivery.driver.phone}
                  {delivery.driver.vehicleType ? ` · ${delivery.driver.vehicleType}` : ''}
                  {delivery.driver.vehicleNumber ? ` · ${delivery.driver.vehicleNumber}` : ''}
                </Text>
                {delivery.driver.driverRating > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Icon name="star" size={12} color="#F59E0B" />
                    <Text style={styles.driverRating}>{delivery.driver.driverRating} · {delivery.driver.totalDeliveries || 0} deliveries</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.reassignBtn}
                onPress={openDriverModal}
              >
                <Text style={styles.reassignBtnText}>Reassign</Text>
              </TouchableOpacity>
            </View>
          ) : isConfirmed ? (
            <View>
              <View style={styles.waitingRiderRow}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.waitingRiderText}>
                  Waiting for a rider to accept...
                </Text>
              </View>
              <View style={{ height: 8 }} />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#6C5CE7' }]}
                onPress={openDriverModal}
              >
                <Icon name="person-add" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>Manually Assign Driver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6C5CE7' }]}
              onPress={openDriverModal}
            >
              <Icon name="person-add" size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>Assign Driver</Text>
            </TouchableOpacity>
          )}

          {/* Status History */}
          {delivery?.statusHistory?.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Status History</Text>
              {delivery.statusHistory.map((entry, i) => (
                <View key={i} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: DELIVERY_STATUS_META[entry.status]?.color || '#999' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyStatus}>{DELIVERY_STATUS_META[entry.status]?.label || entry.status}</Text>
                    {entry.remarks && <Text style={styles.historyRemarks}>{entry.remarks}</Text>}
                  </View>
                  <Text style={styles.historyTime}>
                    {new Date(entry.timestamp).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Driver Selection Modal */}
      <Modal visible={showDriverModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.row}>
              <Text style={styles.modalTitle}>Select Driver</Text>
              <TouchableOpacity onPress={() => setShowDriverModal(false)}>
                <Icon name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {assigning && (
              <ActivityIndicator size="small" color="#6C5CE7" style={{ marginVertical: 16 }} />
            )}

            <FlatList
              data={drivers}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No drivers registered</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.driverOption}
                  onPress={() => handleAssignDriver(item._id)}
                  disabled={assigning}
                >
                  <View style={[styles.driverAvatar, { backgroundColor: item.isAvailable ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Icon name="person" size={20} color={item.isAvailable ? '#22C55E' : '#EF4444'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverName}>{item.name}</Text>
                    <Text style={styles.driverInfo}>
                      {item.phone || 'No phone'}
                      {item.vehicleType ? ` · ${item.vehicleType}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.availBadge, { backgroundColor: item.isAvailable ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.availText, { color: item.isAvailable ? '#22C55E' : '#EF4444' }]}>
                      {item.isAvailable ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  pill: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  pillText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  trackingText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  reviewHint: { fontSize: 11, color: '#6C5CE7', fontWeight: '600' },

  infoGrid: { gap: 8 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#475569', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },

  acceptRejectRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12, gap: 6,
    borderWidth: 1.5, borderColor: '#EF4444', backgroundColor: '#FEF2F2',
  },
  rejectBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12, gap: 6,
    backgroundColor: '#22C55E',
  },
  acceptBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 8 },
  actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },

  // OTP
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 8 },
  otpDigitBox: {
    width: 48, height: 56, borderRadius: 12, backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#F59E0B',
  },
  otpDigitText: { fontSize: 24, fontWeight: '800', color: '#92400E' },
  otpHint: { fontSize: 12, color: '#92400E', textAlign: 'center', marginTop: 4 },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, flexWrap: 'wrap' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  itemMeta: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginRight: 8 },
  strikethrough: { textDecorationLine: 'line-through', color: '#94A3B8' },

  stockRow: { flexDirection: 'row', marginTop: 4 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  stockText: { fontSize: 10, fontWeight: '700' },

  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontSize: 13, fontWeight: '700', color: '#0F172A', minWidth: 24, textAlign: 'center' },
  removeItemBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEE2E2',
    justifyContent: 'center', alignItems: 'center', marginLeft: 6,
  },
  undoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EDE9FE' },
  undoBtnText: { fontSize: 12, fontWeight: '600', color: '#6C5CE7' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  totalLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  totalValue: { fontSize: 13, color: '#475569', fontWeight: '600' },

  // ETA
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  etaText: { fontSize: 12, color: '#059669', fontWeight: '600' },

  // Waiting for rider
  waitingRiderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12 },
  waitingRiderText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },

  // Driver
  driverCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  driverName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  driverInfo: { fontSize: 12, color: '#64748B', marginTop: 1 },
  driverRating: { fontSize: 11, color: '#64748B', marginLeft: 3 },
  reassignBtn: { borderWidth: 1, borderColor: '#6C5CE7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  reassignBtnText: { fontSize: 12, fontWeight: '600', color: '#6C5CE7' },

  // History
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  historyStatus: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  historyRemarks: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  historyTime: { fontSize: 11, color: '#94A3B8' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 14, paddingVertical: 30 },
  driverOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  availBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  availText: { fontSize: 11, fontWeight: '700' },
});

export default AdminOrderDetailScreen;
