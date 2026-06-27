import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';

  const IMAGE_MAP = {
    v1: require('../assets/categories/vegetablefruits/tomato.jpg'),
    v2: require('../assets/categories/vegetablefruits/brinjles.jpg'),
    v3: require('../assets/categories/vegetablefruits/cabagge.jpg'),
    v4: require('../assets/categories/vegetablefruits/cauliflower.jpg'),
    v5: require('../assets/categories/vegetablefruits/brocolli.jpg'),
    v6: require('../assets/categories/vegetablefruits/onions.jpg'),
    v7: require('../assets/categories/vegetablefruits/potato.jpg'),
    v8: require('../assets/categories/vegetablefruits/garlic.jpg'),
    v9: require('../assets/categories/vegetablefruits/lemon.jpg'),
    v10: require('../assets/categories/vegetablefruits/beetroot.jpg'),
    v11: require('../assets/categories/vegetablefruits/carrots.jpg'),
    v12: require('../assets/categories/vegetablefruits/pumpkins.jpg'),
    v13: require('../assets/categories/vegetablefruits/sweetpatotes.jpg'),
    v14: require('../assets/categories/vegetablefruits/ginger.jpg'),
    v15: require('../assets/categories/vegetablefruits/mushrooms.jpg'),
    f1: require('../assets/categories/vegetablefruits/banana.jpg'),
    f2: require('../assets/categories/vegetablefruits/watermalon.jpg'),
    f3: require('../assets/categories/vegetablefruits/apple.jpg'),
    f4: require('../assets/categories/vegetablefruits/oranges.jpg'),
    f5: require('../assets/categories/vegetablefruits/kiwi.jpg'),
    f6: require('../assets/categories/vegetablefruits/strawberry.jpg'),
    f7: require('../assets/categories/vegetablefruits/mango.jpg'),
    f8: require('../assets/categories/vegetablefruits/pineapple.jpg'),
    f9: require('../assets/categories/vegetablefruits/papaya.jpg'),
    f10: require('../assets/categories/vegetablefruits/grappes.jpg'),
    d1: require('../assets/categories/dairy/amulgold.jpg'),
    d2: require('../assets/categories/dairy/almondmilk.jpg'),
    d3: require('../assets/categories/dairy/amulcream.jpg'),
    d4: require('../assets/categories/dairy/dahi.jpg'),
    d5: require('../assets/categories/dairy/mastidahi.jpg'),
    d6: require('../assets/categories/dairy/lassi.jpg'),
    d7: require('../assets/categories/dairy/whiteggs.jpg'),
    d9: require('../assets/categories/dairy/bread.jpg'),
    d10: require('../assets/categories/dairy/wholewheatbread.jpg'),
    m1: require('../assets/categories/Munchies/sweetspicy.jpg'),
    m2: require('../assets/categories/Munchies/indianmagicmasala.jpg'),
    m3: require('../assets/categories/Munchies/hotandsweetchilli.jpg'),
    m4: require('../assets/categories/Munchies/salted.jpg'),
    m5: require('../assets/categories/Munchies/pringles.jpg'),
    m6: require('../assets/categories/Munchies/doriotos.jpg'),
    m7: require('../assets/categories/Munchies/pringlescreamandonion.jpg'),
    m8: require('../assets/categories/Munchies/spicysweetchilli.jpg'),
    m9: require('../assets/categories/Munchies/cheddarjalapenocheetos.jpg'),
    m10: require('../assets/categories/Munchies/takis.jpg'),
    m11: require('../assets/categories/Munchies/pringlesbbq.jpg'),
    c1: require('../assets/categories/colddrinks/cocacola.jpg'),
    c2: require('../assets/categories/colddrinks/pepsi.jpg'),
    c3: require('../assets/categories/colddrinks/sprite.jpg'),
    c4: require('../assets/categories/colddrinks/fanta.jpg'),
    c5: require('../assets/categories/colddrinks/fantaberry.jpg'),
    c6: require('../assets/categories/colddrinks/fantafruitpunch.jpg'),
    c7: require('../assets/categories/colddrinks/fantagrappe.jpg'),
    c8: require('../assets/categories/colddrinks/fantagreenapple.jpg'),
    c9: require('../assets/categories/colddrinks/mangojuice.jpg'),
    c10: require('../assets/categories/colddrinks/moggumoggu.jpg'),
    c11: require('../assets/categories/colddrinks/orangejuice.jpg'),
    c12: require('../assets/categories/colddrinks/pulpyorange.jpg'),
    c13: require('../assets/categories/colddrinks/tropicana.jpg'),
    c14: require('../assets/categories/colddrinks/cherryjuice.jpg'),
    c15: require('../assets/categories/colddrinks/blueberrdrink.jpg'),
    n1: require('../assets/categories/instantfood/buldakblack.jpg'),
    n2: require('../assets/categories/instantfood/buldakpink.jpg'),
    n3: require('../assets/categories/instantfood/buldakyellow.jpg'),
    n4: require('../assets/categories/instantfood/maggicuppa.jpg'),
    n5: require('../assets/categories/instantfood/maggicurryfalvour.jpg'),
    n6: require('../assets/categories/instantfood/poha.jpg'),
    n7: require('../assets/categories/instantfood/upma.jpg'),
    n8: require('../assets/categories/instantfood/yippe.jpg'),
    b1: require('../assets/categories/biscuits/chocolatecookie.jpg'),
    b2: require('../assets/categories/biscuits/desirebutter.jpg'),
    b3: require('../assets/categories/biscuits/momsmagic.jpg'),
    b4: require('../assets/categories/biscuits/fiftyfifty.jpg'),
    b5: require('../assets/categories/biscuits/mariegold.jpg'),
    b6: require('../assets/categories/biscuits/jimjam.jpg'),
    b7: require('../assets/categories/biscuits/littlhearts.jpg'),
    b8: require('../assets/categories/biscuits/milkbikis.jpg'),
    b9: require('../assets/categories/biscuits/nutrichoice.jpg'),
    b10: require('../assets/categories/biscuits/bourbon.jpg'),
    b11: require('../assets/categories/biscuits/happyhappy.jpg'),
    b12: require('../assets/categories/biscuits/hideandseek.jpg'),
    b13: require('../assets/categories/biscuits/unibicchocolate.jpg'),
    b14: require('../assets/categories/biscuits/unibicfruitandnut.jpg'),
    b15: require('../assets/categories/biscuits/orio.jpg'),
    b16: require('../assets/categories/biscuits/oreostrawberry.jpg'),
    s1: require('../assets/categories/sweettooth/cornettochoco.jpg'),
    s2: require('../assets/categories/sweettooth/cornettoblue.jpg'),
    s3: require('../assets/categories/sweettooth/mangum.jpg'),
    s4: require('../assets/categories/sweettooth/ferroro.jpg'),
    s5: require('../assets/categories/sweettooth/kitkatbiscoff.jpg'),
    s6: require('../assets/categories/sweettooth/kitkatcookiecrumble.jpg'),
    s7: require('../assets/categories/sweettooth/oreobites.jpg'),
    s8: require('../assets/categories/sweettooth/snickers.jpg'),
    s9: require('../assets/categories/sweettooth/toblerone.jpg'),
    s10: require('../assets/categories/sweettooth/twix.jpg'),
    s11: require('../assets/categories/sweettooth/kinderjoy.jpg'),
    s12: require('../assets/categories/sweettooth/mars.jpg'),
    s13: require('../assets/categories/sweettooth/bounty.jpg'),
    s14: require('../assets/categories/sweettooth/rafaello.jpg'),
    ar1: require('../assets/categories/Attarice/aashirvadatta.jpg'),
    ar2: require('../assets/categories/Attarice/bhogaata.jpg'),
    ar3: require('../assets/categories/Attarice/dawatbrownrice.jpg'),
    ar4: require('../assets/categories/Attarice/basmatirce.jpg'),
    ar5: require('../assets/categories/Attarice/masoordal.jpg'),
    ar6: require('../assets/categories/Attarice/moongdal.jpg'),
    ar7: require('../assets/categories/Attarice/toordal.jpg'),
    ar8: require('../assets/categories/Attarice/uraldal.jpg'),
    ar9: require('../assets/categories/Attarice/masalaoats.jpg'),
    sc1: require('../assets/categories/sauces/barbeque.jpg'),
    sc2: require('../assets/categories/sauces/harsheystrawberry.jpg'),
    sc3: require('../assets/categories/sauces/hersheycarame;.jpg'),
    sc4: require('../assets/categories/sauces/hersheychoco.jpg'),
    sc5: require('../assets/categories/sauces/hotchilli.jpg'),
    sc6: require('../assets/categories/sauces/mayo.jpg'),
    sc7: require('../assets/categories/sauces/pastasauce.jpg'),
    sc8: require('../assets/categories/sauces/tandoorimayo.jpg'),
    sc9: require('../assets/categories/sauces/tomatobasil.jpg'),
    sc10: require('../assets/categories/sauces/tomatoketcup.jpg'),
    sc11: require('../assets/categories/sauces/yellowmustard.jpg'),
    bc1: require('../assets/categories/babycare/babyrub.jpg'),
    bc2: require('../assets/categories/babycare/johnsonaleopowder.jpg'),
    bc3: require('../assets/categories/babycare/johnsoncream.jpg'),
    bc4: require('../assets/categories/babycare/johnsonoil.jpg'),
    bc5: require('../assets/categories/babycare/johnsonpowder.jpg'),
    bc6: require('../assets/categories/babycare/johnsonwipes.jpg'),
    bc7: require('../assets/categories/babycare/pampersdiaper.jpg'),
    bc8: require('../assets/categories/babycare/pamperswipes.jpg'),
  };

const CartScreen = ({ navigation }) => {
  const { cartItems, cartCount, cartTotal, addItem, removeItem, clearCart, loading } = useCart();

  const deliveryFee = cartTotal > 0 ? (cartTotal >= 299 ? 0 : 25) : 0;
  const grandTotal = cartTotal + deliveryFee;


  const renderItem = ({ item }) => {
    const product = item.product;
    console.log('CART ITEM:', JSON.stringify(item, null, 2));
    const productId = product?._id;

    // Use local image from map, fallback to uri if somehow available
    const localImage = IMAGE_MAP[product?.productKey];

    return (
      <View style={styles.cartItem}>
        <View style={styles.itemImageWrap}>
          {localImage ? (
            <Image source={localImage} style={styles.itemImage} resizeMode="contain" />
          ) : (
            <View style={styles.itemImagePlaceholder} />
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{product?.name}</Text>
          <Text style={styles.itemUnit}>₹{item.price} each</Text>
          <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
        </View>
        <View style={[styles.qtyControl, { borderColor: '#4CAF50' }]}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(productId)}>
            <Text style={[styles.qtyBtnText, { color: '#4CAF50' }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyNum, { color: '#4CAF50' }]}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem({
            id: productId,
            name: product.name,
            productKey: product.productKey,  
            unit: product.unit,
            category: product.category,
            price: item.price,
            ...product,
          })}>
            <Text style={[styles.qtyBtnText, { color: '#4CAF50' }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from categories to get started</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.headerSub}>{cartCount} item{cartCount > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Free delivery nudge */}
      {deliveryFee > 0 && (
        <View style={styles.nudge}>
          <Text style={styles.nudgeText}>
            Add ₹{299 - cartTotal} more for <Text style={styles.nudgeBold}>FREE delivery</Text>
          </Text>
        </View>
      )}

      {/* Items */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{cartTotal}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={[styles.summaryValue, deliveryFee === 0 && { color: '#4CAF50' }]}>
            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F0EF' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, backgroundColor: '#F2F0EF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  backArrow: { fontSize: 18, color: '#111', marginTop: -1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.4 },
  headerSub: { fontSize: 11, color: '#7A9BAA', fontWeight: '500', textAlign: 'center' },
  clearText: { fontSize: 13, fontWeight: '700', color: '#FF5252' },
  nudge: {
    backgroundColor: '#E8F5E9', marginHorizontal: 14, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8,
  },
  nudgeText: { fontSize: 12, color: '#388E3C', fontWeight: '600' },
  nudgeBold: { fontWeight: '800' },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  itemImageWrap: {
    width: 70, height: 70, backgroundColor: '#F5F5F5',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  itemImage: { width: 60, height: 60 },
  itemImagePlaceholder: { width: 60, height: 60, backgroundColor: '#EEE', borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 2, letterSpacing: -0.2 },
  itemUnit: { fontSize: 11, color: '#A0AAB4', fontWeight: '500', marginBottom: 6 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#111' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 8, overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 5 },
  qtyBtnText: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  qtyNum: { fontSize: 13, fontWeight: '800', minWidth: 18, textAlign: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#999', fontWeight: '500', marginBottom: 24 },
  shopBtn: { backgroundColor: '#1A1A1A', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  shopBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  summary: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 34,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 14, letterSpacing: -0.3 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: '#777', fontWeight: '500' },
  summaryValue: { fontSize: 13, color: '#111', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#111' },
  totalValue: { fontSize: 15, fontWeight: '800', color: '#111' },
  checkoutBtn: {
    backgroundColor: '#1A1A1A', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  checkoutText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.2 },
});

export default CartScreen;