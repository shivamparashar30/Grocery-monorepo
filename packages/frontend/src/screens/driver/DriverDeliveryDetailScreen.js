import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, RefreshControl, StyleSheet, Linking, Platform,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSocket } from '../../context/SocketContext';
import { BASE_URL } from '../../config/apiconfig';

const STATUS_FLOW = [
  { key: 'assigned', label: 'Assigned', desc: 'Order assigned to you', icon: 'person', color: '#3B82F6' },
  { key: 'collecting', label: 'Collecting', desc: 'OTP verified, collecting order', icon: 'cart', color: '#6366F1' },
  { key: 'picked-up', label: 'Picked Up', desc: 'Order collected from store', icon: 'bag-check', color: '#8B5CF6' },
  { key: 'out-for-delivery', label: 'On The Way', desc: 'Heading to customer', icon: 'bicycle', color: '#F59E0B' },
  { key: 'arrived', label: 'Arrived', desc: 'At customer location', icon: 'location', color: '#EF4444' },
  { key: 'delivered', label: 'Delivered', desc: 'Handed to customer', icon: 'checkmark-circle', color: '#10B981' },
];

const NEXT_ACTION = {
  assigned: {
    type: 'otp', label: 'Enter Pickup OTP',
    icon: 'keypad', colors: ['#4F46E5', '#6366F1'],
  },
  collecting: {
    status: 'picked-up', label: 'Mark Picked Up',
    icon: 'bag-check', colors: ['#7C3AED', '#8B5CF6'],
  },
  'picked-up': {
    status: 'out-for-delivery', label: 'Start Delivery',
    icon: 'bicycle', colors: ['#D97706', '#F59E0B'],
  },
  'out-for-delivery': {
    status: 'arrived', label: 'Arrived at Location',
    icon: 'location', colors: ['#DC2626', '#EF4444'],
  },
  arrived: {
    status: 'delivered', label: 'Mark as Delivered',
    icon: 'checkmark-circle', colors: ['#059669', '#10B981'],
  },
};

const DriverDeliveryDetailScreen = ({ navigation, route }) => {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const socket = useSocket();

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const fetchDelivery = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/deliveries/${deliveryId}`, { headers });
      const data = await res.json();
      if (data.success) setDelivery(data.data);
    } catch {}
    setLoading(false);
  }, [deliveryId]);

  useFocusEffect(
    useCallback(() => {
      fetchDelivery();
    }, [fetchDelivery])
  );

  // Socket: join delivery room for real-time updates
  useEffect(() => {
    if (!socket || !deliveryId) return;
    socket.joinRoom('delivery', deliveryId);
    const unsub = socket.on('delivery:status-updated', (data) => {
      if (data.deliveryId === deliveryId || data.deliveryId?.toString() === deliveryId) {
        fetchDelivery();
      }
    });
    return () => {
      socket.leaveRoom('delivery', deliveryId);
      unsub();
    };
  }, [socket, deliveryId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDelivery();
    setRefreshing(false);
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/deliveries/${deliveryId}/verify-otp`, {
        method: 'PUT', headers,
        body: JSON.stringify({ otp: otpValue }),
      });
      const data = await res.json();
      if (data.success) {
        setDelivery(data.data);
        setShowOtpInput(false);
        setOtpValue('');
        Alert.alert('Verified!', 'OTP verified. You can now collect the order.');
      } else {
        Alert.alert('Invalid OTP', data.message || 'Please check the OTP and try again.');
      }
    } catch {
      Alert.alert('Error', 'Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    const confirmMsg = newStatus === 'delivered'
      ? 'Confirm that you have delivered this order to the customer?'
      : `Update status to "${newStatus.replace(/-/g, ' ')}"?`;

    Alert.alert('Update Status', confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setUpdating(true);
          try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BASE_URL}/deliveries/${deliveryId}/status`, {
              method: 'PUT', headers,
              body: JSON.stringify({ status: newStatus, remarks: `Driver updated to ${newStatus}` }),
            });
            const data = await res.json();
            if (data.success) {
              setDelivery(data.data);
              if (newStatus === 'delivered') {
                Alert.alert('Delivered!', 'Order has been marked as delivered.', [
                  { text: 'Done', onPress: () => navigation.goBack() },
                ]);
              }
            } else {
              Alert.alert('Error', data.message || 'Failed to update');
            }
          } catch {
            Alert.alert('Error', 'Failed to update status');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const handleCallCustomer = () => {
    const phone = delivery?.order?.user?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert('No Phone', 'Customer phone number not available');
  };

  const handleNavigate = () => {
    const addr = delivery?.order?.shippingAddress;
    if (addr?.location?.lat && addr?.location?.lng) {
      Linking.openURL(`https://maps.google.com/?daddr=${addr.location.lat},${addr.location.lng}`);
    } else if (addr?.address) {
      const q = encodeURIComponent(`${addr.address}, ${addr.city || ''}`);
      Linking.openURL(`https://maps.google.com/?q=${q}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  const nextAction = NEXT_ACTION[delivery?.status];
  const activeIdx = STATUS_FLOW.findIndex(step => step.key === delivery?.status);
  const isDelivered = delivery?.status === 'delivered';
  const order = delivery?.order;
  const address = order?.shippingAddress;
  const customer = order?.user;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: nextAction ? 120 : 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        >
          {/* Header */}
          <LinearGradient colors={['#0F172A', '#1E3A5F']} style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>

            <View style={s.headerContent}>
              <Text style={s.headerLabel}>DELIVERY</Text>
              <Text style={s.headerOrderId}>#{deliveryId?.slice(-6).toUpperCase()}</Text>

              <View style={s.headerStatusRow}>
                {STATUS_FLOW.map((step, i) => {
                  const done = i <= activeIdx;
                  return (
                    <View key={step.key} style={s.headerStepWrap}>
                      <View style={[s.headerStepDot, done && { backgroundColor: step.color }]}>
                        {done && <Icon name={i < activeIdx ? 'checkmark' : step.icon} size={10} color="#FFF" />}
                      </View>
                      {i < STATUS_FLOW.length - 1 && (
                        <View style={[s.headerStepLine, i < activeIdx && { backgroundColor: '#10B981' }]} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* ETA */}
              {delivery?.estimatedDeliveryTime && !isDelivered && (
                <View style={s.etaPill}>
                  <Icon name="time-outline" size={14} color="#60A5FA" />
                  <Text style={s.etaText}>
                    ETA: {new Date(delivery.estimatedDeliveryTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}

              <View style={[s.currentStatusPill, { backgroundColor: (STATUS_FLOW[activeIdx]?.color || '#3B82F6') + '25' }]}>
                <Icon name={STATUS_FLOW[activeIdx]?.icon || 'time'} size={14} color={STATUS_FLOW[activeIdx]?.color || '#FFF'} />
                <Text style={[s.currentStatusText, { color: STATUS_FLOW[activeIdx]?.color || '#FFF' }]}>
                  {STATUS_FLOW[activeIdx]?.label || delivery?.status}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={s.body}>
            {/* Timeline */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Delivery Progress</Text>
              <View style={s.divider} />
              <View style={s.timeline}>
                {STATUS_FLOW.map((step, index) => {
                  const isCompleted = index < activeIdx;
                  const isCurrent = index === activeIdx;
                  const isPending = index > activeIdx;
                  const dotBg = isCompleted ? '#10B981' : isCurrent ? step.color : '#E2E8F0';

                  return (
                    <View key={step.key} style={s.timelineStep}>
                      <View style={s.timelineLeft}>
                        <View style={[
                          s.timelineDot,
                          { backgroundColor: isPending ? '#F8FAFC' : dotBg + '18', borderColor: dotBg, borderWidth: 2 },
                        ]}>
                          <Icon
                            name={isCompleted ? 'checkmark' : step.icon}
                            size={14}
                            color={isPending ? '#D1D5DB' : isCompleted ? '#10B981' : step.color}
                          />
                        </View>
                        {index < STATUS_FLOW.length - 1 && (
                          <View style={[s.timelineLine, { backgroundColor: isCompleted ? '#10B981' : '#E5E7EB' }]} />
                        )}
                      </View>
                      <View style={s.timelineContent}>
                        <Text style={[s.timelineLabel, isPending && { color: '#CBD5E1' }]}>{step.label}</Text>
                        <Text style={[s.timelineDesc, isPending && { color: '#E2E8F0' }]}>{step.desc}</Text>
                        {isCurrent && (
                          <View style={[s.currentBadge, { backgroundColor: step.color + '15' }]}>
                            <View style={[s.currentBadgeDot, { backgroundColor: step.color }]} />
                            <Text style={[s.currentBadgeText, { color: step.color }]}>Current</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* OTP Card (shown when status is assigned) */}
            {delivery?.status === 'assigned' && (
              <View style={[s.card, { borderWidth: 1.5, borderColor: '#6366F1' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Icon name="keypad" size={20} color="#6366F1" />
                  <Text style={s.cardTitle}>Pickup OTP Verification</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                  Enter the 4-digit OTP displayed at the store to verify pickup
                </Text>

                {showOtpInput ? (
                  <View>
                    <TextInput
                      style={s.otpInput}
                      placeholder="Enter 4-digit OTP"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={otpValue}
                      onChangeText={setOtpValue}
                      autoFocus
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <TouchableOpacity
                        style={s.otpCancelBtn}
                        onPress={() => { setShowOtpInput(false); setOtpValue(''); }}
                      >
                        <Text style={s.otpCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.otpVerifyBtn, otpValue.length !== 4 && { opacity: 0.5 }]}
                        onPress={handleVerifyOtp}
                        disabled={otpValue.length !== 4 || verifyingOtp}
                      >
                        {verifyingOtp ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={s.otpVerifyText}>Verify OTP</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={s.otpEnterBtn}
                    onPress={() => setShowOtpInput(true)}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#6366F1']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.otpEnterGradient}
                    >
                      <Icon name="keypad" size={18} color="#FFF" />
                      <Text style={s.otpEnterText}>Enter Pickup OTP</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Customer Card */}
            <View style={s.card}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>Customer</Text>
                {order?.totalPrice && (
                  <Text style={s.orderTotal}>Rs. {order.totalPrice.toFixed(0)}</Text>
                )}
              </View>
              <View style={s.divider} />

              <View style={s.customerInfo}>
                <View style={s.customerAvatar}>
                  <Text style={s.customerInitial}>
                    {(customer?.name || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.customerName}>{customer?.name || 'Customer'}</Text>
                  {customer?.phone && <Text style={s.customerPhone}>{customer.phone}</Text>}
                </View>
              </View>

              {address && (
                <View style={s.addressCard}>
                  <View style={s.addressMarker}>
                    <Icon name="location" size={16} color="#EF4444" />
                  </View>
                  <Text style={s.addressFullText}>
                    {address.address || 'N/A'}
                    {address.city ? `, ${address.city}` : ''}
                    {address.postalCode ? ` - ${address.postalCode}` : ''}
                  </Text>
                </View>
              )}

              {order?.orderNotes ? (
                <View style={s.notesCard}>
                  <Icon name="document-text-outline" size={14} color="#F59E0B" />
                  <Text style={s.notesText}>{order.orderNotes}</Text>
                </View>
              ) : null}

              <View style={s.quickActions}>
                <TouchableOpacity style={s.quickActionBtn} onPress={handleCallCustomer}>
                  <View style={[s.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Icon name="call" size={18} color="#3B82F6" />
                  </View>
                  <Text style={s.quickActionLabel}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.quickActionBtn} onPress={handleNavigate}>
                  <View style={[s.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Icon name="navigate" size={18} color="#10B981" />
                  </View>
                  <Text style={s.quickActionLabel}>Navigate</Text>
                </TouchableOpacity>
                {customer?.phone && (
                  <TouchableOpacity style={s.quickActionBtn} onPress={() => Linking.openURL(`sms:${customer.phone}`)}>
                    <View style={[s.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Icon name="chatbubble" size={18} color="#F59E0B" />
                    </View>
                    <Text style={s.quickActionLabel}>Message</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Order Items */}
            <View style={s.card}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>Order Items</Text>
                <Text style={s.itemCount}>{order?.orderItems?.length || 0} items</Text>
              </View>
              <View style={s.divider} />
              {order?.orderItems?.map((item, i) => (
                <View key={i} style={[s.itemRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                  <View style={s.itemQtyBadge}>
                    <Text style={s.itemQtyText}>{item.quantity}x</Text>
                  </View>
                  <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.itemPrice}>Rs. {(item.quantity * item.price).toFixed(0)}</Text>
                </View>
              ))}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total Amount</Text>
                <Text style={s.totalValue}>Rs. {order?.totalPrice?.toFixed(0) || 0}</Text>
              </View>
              {order?.paymentMethod && (
                <View style={s.paymentRow}>
                  <Icon name="wallet-outline" size={14} color="#64748B" />
                  <Text style={s.paymentText}>Payment: {order.paymentMethod}</Text>
                </View>
              )}
            </View>

            {delivery?.trackingNumber && (
              <View style={s.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name="barcode-outline" size={20} color="#64748B" />
                  <View>
                    <Text style={s.trackingLabel}>Tracking Number</Text>
                    <Text style={s.trackingValue}>{delivery.trackingNumber}</Text>
                  </View>
                </View>
              </View>
            )}

            {isDelivered && (
              <View style={s.deliveredBanner}>
                <Icon name="checkmark-circle" size={24} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={s.deliveredTitle}>Delivered Successfully</Text>
                  <Text style={s.deliveredSub}>This order has been completed</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Button (skip for 'assigned' since OTP card handles it) */}
        {nextAction && nextAction.type !== 'otp' && (
          <View style={s.bottomBar}>
            <TouchableOpacity
              onPress={() => handleUpdateStatus(nextAction.status)}
              disabled={updating}
              activeOpacity={0.85}
              style={s.actionBtnWrap}
            >
              <LinearGradient
                colors={nextAction.colors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.actionBtn}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Icon name={nextAction.icon} size={22} color="#FFF" />
                    <Text style={s.actionBtnText}>{nextAction.label}</Text>
                    <Icon name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 'auto' }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },

  header: { paddingBottom: 24 },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFFFFF15',
    justifyContent: 'center', alignItems: 'center', margin: 16, marginBottom: 0,
  },
  headerContent: { paddingHorizontal: 20, marginTop: 12 },
  headerLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', letterSpacing: 1 },
  headerOrderId: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },

  headerStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  headerStepWrap: { flexDirection: 'row', alignItems: 'center' },
  headerStepDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#334155',
    justifyContent: 'center', alignItems: 'center',
  },
  headerStepLine: { width: 20, height: 2, backgroundColor: '#334155', marginHorizontal: 1 },

  etaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1E3A5F', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: '#2D4A6F',
  },
  etaText: { color: '#60A5FA', fontSize: 12, fontWeight: '700' },

  currentStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  currentStatusText: { fontSize: 13, fontWeight: '700' },

  body: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingTop: 16 },

  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  timeline: { paddingLeft: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', marginRight: 14 },
  timelineDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  timelineLine: { width: 2, height: 16 },
  timelineContent: { flex: 1, paddingBottom: 12 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  timelineDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  currentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginTop: 6,
  },
  currentBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  currentBadgeText: { fontSize: 11, fontWeight: '700' },

  // OTP
  otpInput: {
    borderWidth: 2, borderColor: '#6366F1', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 24,
    fontWeight: '800', color: '#0F172A', textAlign: 'center',
    letterSpacing: 12, backgroundColor: '#F8FAFC',
  },
  otpCancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  otpCancelText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  otpVerifyBtn: {
    flex: 2, borderRadius: 12, paddingVertical: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center', alignItems: 'center',
  },
  otpVerifyText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  otpEnterBtn: { borderRadius: 14, overflow: 'hidden' },
  otpEnterGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  otpEnterText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Customer
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  customerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  customerInitial: { fontSize: 18, fontWeight: '800', color: '#3B82F6' },
  customerName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  customerPhone: { fontSize: 13, color: '#64748B', marginTop: 1 },

  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 14,
  },
  addressMarker: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEE2E2',
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  addressFullText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 19 },

  notesCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 14,
  },
  notesText: { flex: 1, fontSize: 12, color: '#92400E' },

  quickActions: { flexDirection: 'row', gap: 12 },
  quickActionBtn: { flex: 1, alignItems: 'center', gap: 6 },
  quickActionIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  orderTotal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  itemCount: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  itemQtyBadge: {
    width: 28, height: 22, borderRadius: 6, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  itemQtyText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  itemName: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#0F172A' },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1.5, borderTopColor: '#E2E8F0', marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

  paymentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: '#F8FAFC', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  paymentText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  trackingLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  trackingValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 1 },

  deliveredBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 12,
  },
  deliveredTitle: { fontSize: 15, fontWeight: '700', color: '#065F46' },
  deliveredSub: { fontSize: 12, color: '#047857', marginTop: 2 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 15,
  },
  actionBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 20, gap: 10,
  },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default DriverDeliveryDetailScreen;
