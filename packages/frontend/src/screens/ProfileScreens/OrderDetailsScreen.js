import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '../../utils/tailwind';
import { BASE_URL } from '../../config/apiconfig';
import { useSocket } from '../../context/SocketContext';

const DELIVERY_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: 'receipt-outline' },
  { key: 'assigned', label: 'Driver Assigned', icon: 'person-outline' },
  { key: 'collecting', label: 'Collecting Order', icon: 'bag-handle-outline' },
  { key: 'picked-up', label: 'Order Picked Up', icon: 'bag-check-outline' },
  { key: 'out-for-delivery', label: 'On The Way', icon: 'bicycle-outline' },
  { key: 'arrived', label: 'Arrived at Location', icon: 'flag-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' },
];

const STATUS_COLORS = {
  pending: '#F59E0B',
  assigned: '#3B82F6',
  collecting: '#8B5CF6',
  'picked-up': '#A855F7',
  'in-transit': '#06B6D4',
  'out-for-delivery': '#2BB77D',
  arrived: '#0EA5E9',
  delivered: '#22C55E',
  cancelled: '#EF4444',
  failed: '#EF4444',
};

const OrderDetailsScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [orderStatus, setOrderStatus] = useState(order.status);
  const socket = useSocket();

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const fetchDelivery = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/deliveries/order/${order.id}`, { headers });
      const data = await res.json();
      if (data.success) {
        setDelivery(data.data);
      }
    } catch {}
    setLoading(false);
  }, [order.id]);

  useEffect(() => { fetchDelivery(); }, [fetchDelivery]);

  // Socket: join order + delivery rooms for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Join order room
    socket.joinRoom('order', order.id);

    const unsub1 = socket.on('order:status-updated', (data) => {
      if (data.orderId === order.id) {
        setOrderStatus(data.status);
      }
    });

    const unsub2 = socket.on('delivery:status-updated', (data) => {
      if (data.orderId === order.id || data.deliveryId === delivery?._id) {
        setDelivery((prev) => prev ? {
          ...prev,
          status: data.status,
          statusHistory: data.statusHistory || prev.statusHistory,
          estimatedDeliveryTime: data.estimatedDeliveryTime || prev.estimatedDeliveryTime,
        } : prev);
      }
    });

    const unsub3 = socket.on('delivery:assigned', (data) => {
      if (data.orderId === order.id) {
        fetchDelivery(); // Re-fetch to get driver info
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      socket.leaveRoom('order', order.id);
    };
  }, [socket, order.id, delivery?._id]);

  // Join delivery room once we have the delivery ID
  useEffect(() => {
    if (!socket || !delivery?._id) return;
    socket.joinRoom('delivery', delivery._id);
    return () => socket.leaveRoom('delivery', delivery._id);
  }, [socket, delivery?._id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDelivery();
    setRefreshing(false);
  };

  const handleCancel = () => {
    if (orderStatus === 'Delivered' || orderStatus === 'Cancelled' || orderStatus === 'delivered' || orderStatus === 'cancelled') return;
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelling(true);
            const headers = await getAuthHeaders();
            const res = await fetch(`${BASE_URL}/orders/${order.id}/cancel`, {
              method: 'PUT', headers,
            });
            const data = await res.json();
            if (data.success) {
              Alert.alert('Cancelled', 'Your order has been cancelled.');
              navigation.goBack();
            } else {
              Alert.alert('Error', data.message || 'Failed to cancel');
            }
          } catch {
            Alert.alert('Error', 'Failed to cancel order');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleCallDriver = () => {
    if (delivery?.driver?.phone) {
      Linking.openURL(`tel:${delivery.driver.phone}`);
    }
  };

  const getActiveStepIndex = () => {
    if (!delivery) return 0;
    const idx = DELIVERY_STATUSES.findIndex(s => s.key === delivery.status);
    return idx >= 0 ? idx : 0;
  };

  const getEtaText = () => {
    if (!delivery?.estimatedDeliveryTime) return null;
    const eta = new Date(delivery.estimatedDeliveryTime);
    const now = new Date();
    const diffMs = eta - now;
    if (diffMs <= 0) return 'Arriving soon';
    const mins = Math.ceil(diffMs / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const activeStep = getActiveStepIndex();
  const isDelivered = orderStatus === 'Delivered' || orderStatus === 'delivered' || delivery?.status === 'delivered';
  const isCancelled = orderStatus === 'Cancelled' || orderStatus === 'cancelled' || delivery?.status === 'cancelled';
  const etaText = getEtaText();

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={tw`bg-white`}>
        <View style={tw`flex-row items-center px-4 py-3`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex-row items-center flex-1`}>
            <Icon name="chevron-back" size={24} color="#1A1A1A" />
            <Text style={tw`text-lg font-semibold text-[#1A1A1A] ml-2`}>Order Details</Text>
          </TouchableOpacity>
          {etaText && !isDelivered && !isCancelled && delivery?.status !== 'pending' && (
            <View style={tw`bg-green-100 px-3 py-1.5 rounded-full flex-row items-center`}>
              <Icon name="time-outline" size={14} color="#059669" />
              <Text style={tw`text-xs font-bold text-green-700 ml-1`}>ETA: {etaText}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#2BB77D" />
        </View>
      ) : (
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`p-4 pb-8`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2BB77D" />}
        >
          {/* Order Header */}
          <View style={tw`bg-white rounded-2xl p-4 mb-3`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={tw`text-base font-bold text-[#1A1A1A]`}>{order.orderNumber}</Text>
              <View style={tw`px-3 py-1 rounded-full ${isDelivered ? 'bg-green-100' : isCancelled ? 'bg-red-100' : 'bg-blue-100'}`}>
                <Text style={tw`text-xs font-bold ${isDelivered ? 'text-green-700' : isCancelled ? 'text-red-700' : 'text-blue-700'}`}>
                  {isCancelled ? 'Cancelled' : isDelivered ? 'Delivered' : 'Processing'}
                </Text>
              </View>
            </View>
            <Text style={tw`text-sm text-gray-500 mb-1`}>{order.date}</Text>
            <Text style={tw`text-sm text-gray-500`}>{order.items} items · {order.total}</Text>
            {order.deliveryAddress ? (
              <View style={tw`flex-row items-start mt-2`}>
                <Icon name="location-outline" size={16} color="#666" style={{ marginTop: 2 }} />
                <Text style={tw`text-sm text-gray-600 ml-2 flex-1`}>{order.deliveryAddress}</Text>
              </View>
            ) : null}
          </View>

          {/* Tracking Timeline */}
          {!isCancelled && (
            <View style={tw`bg-white rounded-2xl p-4 mb-3`}>
              <Text style={tw`text-base font-bold text-[#1A1A1A] mb-4`}>Order Tracking</Text>
              {delivery?.trackingNumber && (
                <Text style={tw`text-xs text-gray-400 mb-4`}>Tracking: {delivery.trackingNumber}</Text>
              )}

              {DELIVERY_STATUSES.map((step, index) => {
                const isCompleted = index < activeStep;
                const isCurrent = index === activeStep;
                const isPending = index > activeStep;
                const color = isCurrent ? (STATUS_COLORS[step.key] || '#2BB77D')
                  : isCompleted ? '#22C55E' : '#D1D5DB';

                const historyEntry = delivery?.statusHistory?.find(h => h.key === step.key || h.status === step.key);
                const timestamp = historyEntry?.timestamp
                  ? new Date(historyEntry.timestamp).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })
                  : null;

                return (
                  <View key={step.key} style={tw`flex-row items-start mb-0`}>
                    <View style={tw`items-center mr-4`}>
                      <View style={[
                        tw`w-8 h-8 rounded-full justify-center items-center`,
                        { backgroundColor: isPending ? '#F3F4F6' : color + '20' },
                      ]}>
                        <Icon
                          name={isCompleted ? 'checkmark' : step.icon}
                          size={16}
                          color={isPending ? '#D1D5DB' : color}
                        />
                      </View>
                      {index < DELIVERY_STATUSES.length - 1 && (
                        <View style={[
                          tw`w-0.5 h-8`,
                          { backgroundColor: isCompleted ? '#22C55E' : '#E5E7EB' },
                        ]} />
                      )}
                    </View>

                    <View style={tw`flex-1 pb-4`}>
                      <Text style={[
                        tw`text-sm font-semibold`,
                        { color: isPending ? '#9CA3AF' : '#1A1A1A' },
                      ]}>
                        {step.label}
                      </Text>
                      {timestamp && (
                        <Text style={tw`text-xs text-gray-400 mt-0.5`}>{timestamp}</Text>
                      )}
                      {isCurrent && step.key === 'assigned' && delivery?.driver && (
                        <Text style={tw`text-xs text-blue-600 mt-0.5`}>
                          {delivery.driver.name} has been assigned
                        </Text>
                      )}
                      {isCurrent && step.key === 'collecting' && delivery?.driver && (
                        <Text style={tw`text-xs text-purple-600 mt-0.5`}>
                          {delivery.driver.name} is collecting your order
                        </Text>
                      )}
                      {isCurrent && step.key === 'picked-up' && delivery?.driver && (
                        <Text style={tw`text-xs text-purple-600 mt-0.5`}>
                          {delivery.driver.name} picked up your order
                        </Text>
                      )}
                      {isCurrent && step.key === 'out-for-delivery' && delivery?.driver && (
                        <Text style={tw`text-xs text-green-600 mt-0.5`}>
                          {delivery.driver.name} is on the way to you
                        </Text>
                      )}
                      {isCurrent && step.key === 'arrived' && delivery?.driver && (
                        <Text style={tw`text-xs text-blue-600 mt-0.5`}>
                          {delivery.driver.name} has arrived at your location
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Driver Card */}
          {delivery?.driver && !isCancelled && (
            <View style={tw`bg-white rounded-2xl p-4 mb-3`}>
              <Text style={tw`text-base font-bold text-[#1A1A1A] mb-3`}>Delivery Partner</Text>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-12 h-12 bg-blue-100 rounded-full justify-center items-center mr-3`}>
                  <Icon name="person" size={24} color="#3B82F6" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>{delivery.driver.name}</Text>
                  <View style={tw`flex-row items-center gap-3 mt-1`}>
                    {delivery.driver.vehicleType && (
                      <View style={tw`flex-row items-center`}>
                        <Icon name="car-outline" size={14} color="#666" />
                        <Text style={tw`text-xs text-gray-500 ml-1`}>
                          {delivery.driver.vehicleType} · {delivery.driver.vehicleNumber || ''}
                        </Text>
                      </View>
                    )}
                    {delivery.driver.driverRating > 0 && (
                      <View style={tw`flex-row items-center`}>
                        <Icon name="star" size={14} color="#F59E0B" />
                        <Text style={tw`text-xs text-gray-500 ml-0.5`}>{delivery.driver.driverRating}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {delivery.driver.phone && (
                  <TouchableOpacity
                    style={tw`w-10 h-10 bg-green-100 rounded-full justify-center items-center`}
                    onPress={handleCallDriver}
                  >
                    <Icon name="call" size={20} color="#22C55E" />
                  </TouchableOpacity>
                )}
              </View>
              {etaText && !isDelivered && delivery.status !== 'pending' && (
                <View style={tw`mt-3 bg-green-50 rounded-xl p-3 flex-row items-center`}>
                  <Icon name="time-outline" size={16} color="#059669" />
                  <Text style={tw`text-sm font-semibold text-green-700 ml-2`}>
                    Estimated delivery in {etaText}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Order Items */}
          <View style={tw`bg-white rounded-2xl p-4 mb-3`}>
            <Text style={tw`text-base font-bold text-[#1A1A1A] mb-3`}>Order Items</Text>
            {order.products?.map((product, index) => (
              <View key={index} style={tw`flex-row items-center py-2 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                <View style={tw`w-8 h-8 bg-gray-100 rounded-lg justify-center items-center mr-3`}>
                  <Text style={tw`text-xs font-bold text-gray-500`}>{product.name?.charAt(0)}</Text>
                </View>
                <Text style={tw`flex-1 text-sm text-[#1A1A1A]`}>{product.name}</Text>
              </View>
            ))}
            {order.items > (order.products?.length || 0) && (
              <Text style={tw`text-xs text-gray-400 mt-1`}>
                +{order.items - (order.products?.length || 0)} more items
              </Text>
            )}
          </View>

          {/* Payment Summary */}
          <View style={tw`bg-white rounded-2xl p-4 mb-3`}>
            <Text style={tw`text-base font-bold text-[#1A1A1A] mb-3`}>Payment Summary</Text>
            <View style={tw`flex-row justify-between py-2 border-t border-gray-100`}>
              <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>Total</Text>
              <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>{order.total}</Text>
            </View>
            <View style={tw`flex-row items-center mt-1`}>
              <Icon name="cash-outline" size={14} color="#666" />
              <Text style={tw`text-xs text-gray-500 ml-1`}>Cash on Delivery</Text>
            </View>
          </View>

          {/* Cancel Button */}
          {orderStatus === 'Processing' && !isDelivered && !isCancelled && (
            <TouchableOpacity
              style={tw`bg-red-50 rounded-2xl p-4 items-center border border-red-200`}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text style={tw`text-sm font-bold text-red-600`}>Cancel Order</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default OrderDetailsScreen;
