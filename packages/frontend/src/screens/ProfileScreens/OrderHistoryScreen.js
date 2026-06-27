import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from '../../utils/tailwind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/apiconfig';

const IMAGE_MAP = {
  v1: require('../../assets/categories/vegetablefruits/tomato.jpg'),
  v2: require('../../assets/categories/vegetablefruits/brinjles.jpg'),
  v3: require('../../assets/categories/vegetablefruits/cabagge.jpg'),
  v4: require('../../assets/categories/vegetablefruits/cauliflower.jpg'),
  v5: require('../../assets/categories/vegetablefruits/brocolli.jpg'),
  v6: require('../../assets/categories/vegetablefruits/onions.jpg'),
  v7: require('../../assets/categories/vegetablefruits/potato.jpg'),
  v8: require('../../assets/categories/vegetablefruits/garlic.jpg'),
  v9: require('../../assets/categories/vegetablefruits/lemon.jpg'),
  v10: require('../../assets/categories/vegetablefruits/beetroot.jpg'),
  v11: require('../../assets/categories/vegetablefruits/carrots.jpg'),
  v12: require('../../assets/categories/vegetablefruits/pumpkins.jpg'),
  v13: require('../../assets/categories/vegetablefruits/sweetpatotes.jpg'),
  v14: require('../../assets/categories/vegetablefruits/ginger.jpg'),
  v15: require('../../assets/categories/vegetablefruits/mushrooms.jpg'),
  f1: require('../../assets/categories/vegetablefruits/banana.jpg'),
  f2: require('../../assets/categories/vegetablefruits/watermalon.jpg'),
  f3: require('../../assets/categories/vegetablefruits/apple.jpg'),
  f4: require('../../assets/categories/vegetablefruits/oranges.jpg'),
  f5: require('../../assets/categories/vegetablefruits/kiwi.jpg'),
  f6: require('../../assets/categories/vegetablefruits/strawberry.jpg'),
  f7: require('../../assets/categories/vegetablefruits/mango.jpg'),
  f8: require('../../assets/categories/vegetablefruits/pineapple.jpg'),
  f9: require('../../assets/categories/vegetablefruits/papaya.jpg'),
  f10: require('../../assets/categories/vegetablefruits/grappes.jpg'),
  d1: require('../../assets/categories/dairy/amulgold.jpg'),
  d2: require('../../assets/categories/dairy/almondmilk.jpg'),
  d3: require('../../assets/categories/dairy/amulcream.jpg'),
  d4: require('../../assets/categories/dairy/dahi.jpg'),
  d5: require('../../assets/categories/dairy/mastidahi.jpg'),
  d6: require('../../assets/categories/dairy/lassi.jpg'),
  d7: require('../../assets/categories/dairy/whiteggs.jpg'),
  d9: require('../../assets/categories/dairy/bread.jpg'),
  d10: require('../../assets/categories/dairy/wholewheatbread.jpg'),
  m1: require('../../assets/categories/Munchies/sweetspicy.jpg'),
  m2: require('../../assets/categories/Munchies/indianmagicmasala.jpg'),
  m3: require('../../assets/categories/Munchies/hotandsweetchilli.jpg'),
  m4: require('../../assets/categories/Munchies/salted.jpg'),
  m5: require('../../assets/categories/Munchies/pringles.jpg'),
  m6: require('../../assets/categories/Munchies/doriotos.jpg'),
  m7: require('../../assets/categories/Munchies/pringlescreamandonion.jpg'),
  m8: require('../../assets/categories/Munchies/spicysweetchilli.jpg'),
  m9: require('../../assets/categories/Munchies/cheddarjalapenocheetos.jpg'),
  m10: require('../../assets/categories/Munchies/takis.jpg'),
  m11: require('../../assets/categories/Munchies/pringlesbbq.jpg'),
  c1: require('../../assets/categories/colddrinks/cocacola.jpg'),
  c2: require('../../assets/categories/colddrinks/pepsi.jpg'),
  c3: require('../../assets/categories/colddrinks/sprite.jpg'),
  c4: require('../../assets/categories/colddrinks/fanta.jpg'),
  c5: require('../../assets/categories/colddrinks/fantaberry.jpg'),
  c6: require('../../assets/categories/colddrinks/fantafruitpunch.jpg'),
  c7: require('../../assets/categories/colddrinks/fantagrappe.jpg'),
  c8: require('../../assets/categories/colddrinks/fantagreenapple.jpg'),
  c9: require('../../assets/categories/colddrinks/mangojuice.jpg'),
  c10: require('../../assets/categories/colddrinks/moggumoggu.jpg'),
  c11: require('../../assets/categories/colddrinks/orangejuice.jpg'),
  c12: require('../../assets/categories/colddrinks/pulpyorange.jpg'),
  c13: require('../../assets/categories/colddrinks/tropicana.jpg'),
  c14: require('../../assets/categories/colddrinks/cherryjuice.jpg'),
  c15: require('../../assets/categories/colddrinks/blueberrdrink.jpg'),
  n1: require('../../assets/categories/instantfood/buldakblack.jpg'),
  n2: require('../../assets/categories/instantfood/buldakpink.jpg'),
  n3: require('../../assets/categories/instantfood/buldakyellow.jpg'),
  n4: require('../../assets/categories/instantfood/maggicuppa.jpg'),
  n5: require('../../assets/categories/instantfood/maggicurryfalvour.jpg'),
  n6: require('../../assets/categories/instantfood/poha.jpg'),
  n7: require('../../assets/categories/instantfood/upma.jpg'),
  n8: require('../../assets/categories/instantfood/yippe.jpg'),
  b1: require('../../assets/categories/biscuits/chocolatecookie.jpg'),
  b2: require('../../assets/categories/biscuits/desirebutter.jpg'),
  b3: require('../../assets/categories/biscuits/momsmagic.jpg'),
  b4: require('../../assets/categories/biscuits/fiftyfifty.jpg'),
  b5: require('../../assets/categories/biscuits/mariegold.jpg'),
  b6: require('../../assets/categories/biscuits/jimjam.jpg'),
  b7: require('../../assets/categories/biscuits/littlhearts.jpg'),
  b8: require('../../assets/categories/biscuits/milkbikis.jpg'),
  b9: require('../../assets/categories/biscuits/nutrichoice.jpg'),
  b10: require('../../assets/categories/biscuits/bourbon.jpg'),
  b11: require('../../assets/categories/biscuits/happyhappy.jpg'),
  b12: require('../../assets/categories/biscuits/hideandseek.jpg'),
  b13: require('../../assets/categories/biscuits/unibicchocolate.jpg'),
  b14: require('../../assets/categories/biscuits/unibicfruitandnut.jpg'),
  b15: require('../../assets/categories/biscuits/orio.jpg'),
  b16: require('../../assets/categories/biscuits/oreostrawberry.jpg'),
  s1: require('../../assets/categories/sweettooth/cornettochoco.jpg'),
  s2: require('../../assets/categories/sweettooth/cornettoblue.jpg'),
  s3: require('../../assets/categories/sweettooth/mangum.jpg'),
  s4: require('../../assets/categories/sweettooth/ferroro.jpg'),
  s5: require('../../assets/categories/sweettooth/kitkatbiscoff.jpg'),
  s6: require('../../assets/categories/sweettooth/kitkatcookiecrumble.jpg'),
  s7: require('../../assets/categories/sweettooth/oreobites.jpg'),
  s8: require('../../assets/categories/sweettooth/snickers.jpg'),
  s9: require('../../assets/categories/sweettooth/toblerone.jpg'),
  s10: require('../../assets/categories/sweettooth/twix.jpg'),
  s11: require('../../assets/categories/sweettooth/kinderjoy.jpg'),
  s12: require('../../assets/categories/sweettooth/mars.jpg'),
  s13: require('../../assets/categories/sweettooth/bounty.jpg'),
  s14: require('../../assets/categories/sweettooth/rafaello.jpg'),
  ar1: require('../../assets/categories/Attarice/aashirvadatta.jpg'),
  ar2: require('../../assets/categories/Attarice/bhogaata.jpg'),
  ar3: require('../../assets/categories/Attarice/dawatbrownrice.jpg'),
  ar4: require('../../assets/categories/Attarice/basmatirce.jpg'),
  ar5: require('../../assets/categories/Attarice/masoordal.jpg'),
  ar6: require('../../assets/categories/Attarice/moongdal.jpg'),
  ar7: require('../../assets/categories/Attarice/toordal.jpg'),
  ar8: require('../../assets/categories/Attarice/uraldal.jpg'),
  ar9: require('../../assets/categories/Attarice/masalaoats.jpg'),
  sc1: require('../../assets/categories/sauces/barbeque.jpg'),
  sc2: require('../../assets/categories/sauces/harsheystrawberry.jpg'),
  sc3: require('../../assets/categories/sauces/hersheycarame;.jpg'),
  sc4: require('../../assets/categories/sauces/hersheychoco.jpg'),
  sc5: require('../../assets/categories/sauces/hotchilli.jpg'),
  sc6: require('../../assets/categories/sauces/mayo.jpg'),
  sc7: require('../../assets/categories/sauces/pastasauce.jpg'),
  sc8: require('../../assets/categories/sauces/tandoorimayo.jpg'),
  sc9: require('../../assets/categories/sauces/tomatobasil.jpg'),
  sc10: require('../../assets/categories/sauces/tomatoketcup.jpg'),
  sc11: require('../../assets/categories/sauces/yellowmustard.jpg'),
  bc1: require('../../assets/categories/babycare/babyrub.jpg'),
  bc2: require('../../assets/categories/babycare/johnsonaleopowder.jpg'),
  bc3: require('../../assets/categories/babycare/johnsoncream.jpg'),
  bc4: require('../../assets/categories/babycare/johnsonoil.jpg'),
  bc5: require('../../assets/categories/babycare/johnsonpowder.jpg'),
  bc6: require('../../assets/categories/babycare/johnsonwipes.jpg'),
  bc7: require('../../assets/categories/babycare/pampersdiaper.jpg'),
  bc8: require('../../assets/categories/babycare/pamperswipes.jpg'),
};


const OrderHistoryScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['All', 'Delivered', 'Processing', 'Cancelled'];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/orders/myorders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          // Map backend shape to the UI shape
          const mapped = data.data.map(order => ({
            id: order._id,
            orderNumber: `ORD-${order._id.slice(-8).toUpperCase()}`,
            date: new Date(order.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }),
            status: order.status === 'cancelled' ? 'Cancelled'
              : order.isDelivered ? 'Delivered'
                : 'Processing',
            items: order.orderItems.reduce((sum, i) => sum + i.quantity, 0),
            total: `₹${order.totalPrice}`,
            products: order.orderItems.slice(0, 2).map(i => ({
              name: i.name,
              productKey: i.productKey,
            })),
            deliveryAddress: order.shippingAddress?.address || '',
            estimatedDelivery: !order.isDelivered && order.status !== 'cancelled'
              ? 'Within 15 min' : undefined,
            cancelReason: order.status === 'cancelled' ? 'Cancelled by customer' : undefined,
          }));
          setOrders(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: 'checkmark-circle' };
      case 'Processing':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'time' };
      case 'Cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: 'close-circle' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'help-circle' };
    }
  };

  const filteredOrders = selectedTab === 'All'
    ? orders
    : orders.filter(order => order.status === selectedTab);

  const renderOrder = (order) => {
    const statusStyle = getStatusColor(order.status);

    return (
      <TouchableOpacity
        key={order.id}
        style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-200`}
        onPress={() => navigation.navigate('OrderDetails', { order })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-bold text-[#1A1A1A] mb-1`}>
              {order.orderNumber}
            </Text>
            <Text style={tw`text-xs text-gray-500`}>
              {order.date}
            </Text>
          </View>
          <View style={tw`${statusStyle.bg} px-3 py-1.5 rounded-full flex-row items-center`}>
            <Icon name={statusStyle.icon} size={14} color={statusStyle.text.replace('text-', '#')} />
            <Text style={tw`text-xs font-bold ${statusStyle.text} ml-1`}>
              {order.status}
            </Text>
          </View>
        </View>

        {/* Products Preview */}
        <View style={tw`flex-row gap-2 mb-3`}>
          {order.products.map((product, index) => (
            <View key={index} style={tw`bg-gray-100 rounded-xl p-2 w-14 h-14`}>
              {IMAGE_MAP[product.productKey] ? (
                <Image
                  source={IMAGE_MAP[product.productKey]}
                  style={tw`w-full h-full rounded-lg`}
                  resizeMode="contain"
                />
              ) : (
                <View style={tw`w-full h-full rounded-lg bg-gray-200 items-center justify-center`}>
                  <Text style={tw`text-xs font-bold text-gray-500`}>
                    {product.name?.charAt(0)}
                  </Text>
                </View>
              )}
            </View>
          ))}
          {order.items > order.products.length && (
            <View style={tw`bg-gray-100 rounded-xl w-14 h-14 justify-center items-center`}>
              <Text style={tw`text-xs font-bold text-gray-600`}>
                +{order.items - order.products.length}
              </Text>
            </View>
          )}
        </View>

        {/* Order Details */}
        <View style={tw`border-t border-gray-100 pt-3`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-row items-center flex-1`}>
              <Icon name="location-outline" size={16} color="#666" />
              <Text style={tw`text-sm text-gray-600 ml-2 flex-1`} numberOfLines={1}>
                {order.deliveryAddress}
              </Text>
            </View>
          </View>

          {order.status === 'Processing' && order.estimatedDelivery && (
            <View style={tw`flex-row items-center mb-2`}>
              <Icon name="calendar-outline" size={16} color="#666" />
              <Text style={tw`text-sm text-gray-600 ml-2`}>
                Est. delivery: {order.estimatedDelivery}
              </Text>
            </View>
          )}

          {order.status === 'Cancelled' && order.cancelReason && (
            <View style={tw`flex-row items-center mb-2`}>
              <Icon name="information-circle-outline" size={16} color="#EF4444" />
              <Text style={tw`text-sm text-red-600 ml-2`}>
                {order.cancelReason}
              </Text>
            </View>
          )}

          <View style={tw`flex-row items-center justify-between mt-2`}>
            <View style={tw`flex-row items-center`}>
              <MaterialCommunityIcons name="package-variant-closed" size={16} color="#666" />
              <Text style={tw`text-sm text-gray-600 ml-2`}>
                {order.items} items
              </Text>
            </View>
            <Text style={tw`text-lg font-bold text-[#1A1A1A]`}>
              {order.total}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-2 mt-3 pt-3 border-t border-gray-100`}>
          {order.status === 'Delivered' && (
            <>
              <TouchableOpacity
                style={tw`flex-1 bg-green-50 rounded-lg py-2.5 items-center border border-green-500`}
                onPress={() => console.log('Reorder')}
              >
                <Text style={tw`text-sm font-bold text-green-600`}>Reorder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-100 rounded-lg py-2.5 items-center`}
                onPress={() => console.log('Rate')}
              >
                <Text style={tw`text-sm font-bold text-[#1A1A1A]`}>Rate Order</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === 'Processing' && (
            <>
              <TouchableOpacity
                style={tw`flex-1 bg-blue-50 rounded-lg py-2.5 items-center border border-blue-500`}
                onPress={() => console.log('Track')}
              >
                <Text style={tw`text-sm font-bold text-blue-600`}>Track Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-red-50 rounded-lg py-2.5 items-center border border-red-500`}
                onPress={() => console.log('Cancel')}
              >
                <Text style={tw`text-sm font-bold text-red-600`}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === 'Cancelled' && (
            <TouchableOpacity
              style={tw`flex-1 bg-green-50 rounded-lg py-2.5 items-center border border-green-500`}
              onPress={() => console.log('Reorder')}
            >
              <Text style={tw`text-sm font-bold text-green-600`}>Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={tw`bg-white shadow-sm`}>
        <View style={tw`px-4 py-3`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`flex-row items-center mb-3`}
          >
            <Icon name="chevron-back" size={24} color="#1A1A1A" />
            <Text style={tw`text-lg font-semibold text-[#1A1A1A] ml-2`}>
              Order History
            </Text>
          </TouchableOpacity>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2`}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={tw`px-4 py-2 rounded-full ${selectedTab === tab ? 'bg-green-500' : 'bg-gray-100'}`}
                onPress={() => setSelectedTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={tw`text-sm font-bold ${selectedTab === tab ? 'text-white' : 'text-gray-600'}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Orders List */}
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`p-4 pb-6`}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={tw`mt-20`} />
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrder)
        ) : (
          <View style={tw`items-center justify-center py-20`}>
            <MaterialCommunityIcons name="package-variant" size={80} color="#D1D5DB" />
            <Text style={tw`text-lg font-semibold text-gray-400 mt-4`}>
              No orders found
            </Text>
            <Text style={tw`text-sm text-gray-400 mt-2 text-center px-8`}>
              You haven't placed any {selectedTab !== 'All' ? selectedTab.toLowerCase() : ''} orders yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OrderHistoryScreen;