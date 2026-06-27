import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { BASE_URL } from '../config/apiconfig';
import { useCart } from '../context/CartContext';
import AddressSelectionModal from './Homescreen/AddressSelectionModal';
import { CommonActions } from '@react-navigation/native';
import { Alert, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


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

const PRODUCT_UNIT_MAP = {
    '69f747441a331c9902d3a5b8': '500g', '69f747441a331c9902d3a5b9': '500g',
    '69f747441a331c9902d3a5ba': '1 pc', '69f747441a331c9902d3a5bb': '1 pc',
    '69f747441a331c9902d3a5bc': '250g', '69f747441a331c9902d3a5bd': '500g',
    '69f747441a331c9902d3a5be': '500g', '69f747441a331c9902d3a5bf': '100g',
    '69f747441a331c9902d3a5c0': '3 pcs', '69f747441a331c9902d3a5c1': '500g',
    '69f747441a331c9902d3a5c2': '500g', '69f747441a331c9902d3a5c3': '500g',
    '69f747441a331c9902d3a5c4': '500g', '69f747441a331c9902d3a5c5': '100g',
    '69f747441a331c9902d3a5c6': '200g', '69f747441a331c9902d3a5c7': '6 pcs',
    '69f747441a331c9902d3a5c8': '1 pc', '69f747441a331c9902d3a5c9': '500g',
    '69f747441a331c9902d3a5ca': '4 pcs', '69f747441a331c9902d3a5cb': '2 pcs',
    '69f747441a331c9902d3a5cc': '250g', '69f747441a331c9902d3a5cd': '2 pcs',
    '69f747441a331c9902d3a5ce': '1 pc', '69f747441a331c9902d3a5cf': '1 pc',
    '69f747441a331c9902d3a5d0': '500g', '69f747441a331c9902d3a5d1': '500ml',
    '69f747441a331c9902d3a5d2': '1L', '69f747441a331c9902d3a5d3': '200ml',
    '69f747441a331c9902d3a5d4': '400g', '69f747441a331c9902d3a5d5': '400g',
    '69f747441a331c9902d3a5d6': '200ml', '69f747441a331c9902d3a5d7': '12 pcs',
    '69f747441a331c9902d3a5d8': '400g', '69f747441a331c9902d3a5d9': '400g',
    '69f747441a331c9902d3a5da': '26g', '69f747441a331c9902d3a5db': '26g',
    '69f747441a331c9902d3a5dc': '26g', '69f747441a331c9902d3a5dd': '26g',
    '69f747441a331c9902d3a5de': '107g', '69f747441a331c9902d3a5df': '40g',
    '69f747441a331c9902d3a5e0': '107g', '69f747441a331c9902d3a5e1': '40g',
    '69f747441a331c9902d3a5e2': '40g', '69f747441a331c9902d3a5e3': '56g',
    '69f747441a331c9902d3a5e4': '107g', '69f747441a331c9902d3a5e5': '750ml',
    '69f747441a331c9902d3a5e6': '750ml', '69f747441a331c9902d3a5e7': '750ml',
    '69f747441a331c9902d3a5e8': '750ml', '69f747441a331c9902d3a5e9': '330ml',
    '69f747441a331c9902d3a5ea': '330ml', '69f747441a331c9902d3a5eb': '330ml',
    '69f747441a331c9902d3a5ec': '330ml', '69f747441a331c9902d3a5ed': '200ml',
    '69f747441a331c9902d3a5ee': '320ml', '69f747441a331c9902d3a5ef': '200ml',
    '69f747441a331c9902d3a5f0': '400ml', '69f747441a331c9902d3a5f1': '1L',
    '69f747441a331c9902d3a5f2': '500ml', '69f747441a331c9902d3a5f3': '330ml',
    '69f747441a331c9902d3a5f4': '1 pc', '69f747441a331c9902d3a5f5': '1 pc',
    '69f747441a331c9902d3a5f6': '1 pc', '69f747441a331c9902d3a5f7': '70g',
    '69f747441a331c9902d3a5f8': '70g', '69f747441a331c9902d3a5f9': '80g',
    '69f747441a331c9902d3a5fa': '80g', '69f747441a331c9902d3a5fb': '70g',
    '69f747441a331c9902d3a5fc': '75g', '69f747441a331c9902d3a5fd': '100g',
    '69f747441a331c9902d3a5fe': '100g', '69f747441a331c9902d3a5ff': '66g',
    '69f747441a331c9902d3a600': '250g', '69f747441a331c9902d3a601': '100g',
    '69f747441a331c9902d3a602': '75g', '69f747441a331c9902d3a603': '56g',
    '69f747441a331c9902d3a604': '100g', '69f747441a331c9902d3a605': '100g',
    '69f747441a331c9902d3a606': '120g', '69f747441a331c9902d3a607': '100g',
    '69f747441a331c9902d3a608': '75g', '69f747441a331c9902d3a609': '75g',
    '69f747441a331c9902d3a60a': '120g', '69f747441a331c9902d3a60b': '120g',
    '69f747441a331c9902d3a60c': '1 pc', '69f747441a331c9902d3a60d': '1 pc',
    '69f747441a331c9902d3a60e': '1 pc', '69f747441a331c9902d3a60f': '16 pcs',
    '69f747441a331c9902d3a610': '1 pc', '69f747441a331c9902d3a611': '1 pc',
    '69f747441a331c9902d3a612': '75g', '69f747441a331c9902d3a613': '162g',
    '69f747441a331c9902d3a614': '100g', '69f747441a331c9902d3a615': '50g',
    '69f747441a331c9902d3a616': '1 pc', '69f747441a331c9902d3a617': '162g',
    '69f747441a331c9902d3a618': '57g', '69f747441a331c9902d3a619': '150g',
    '69f747441a331c9902d3a61a': '5kg', '69f747441a331c9902d3a61b': '5kg',
    '69f747441a331c9902d3a61c': '1kg', '69f747441a331c9902d3a61d': '1kg',
    '69f747441a331c9902d3a61e': '500g', '69f747441a331c9902d3a61f': '500g',
    '69f747441a331c9902d3a620': '500g', '69f747441a331c9902d3a621': '500g',
    '69f747441a331c9902d3a622': '39g', '69f747441a331c9902d3a623': '875ml',
    '69f747441a331c9902d3a624': '200ml', '69f747441a331c9902d3a625': '200ml',
    '69f747441a331c9902d3a626': '200ml', '69f747441a331c9902d3a627': '300ml',
    '69f747441a331c9902d3a628': '400ml', '69f747441a331c9902d3a629': '680g',
    '69f747441a331c9902d3a62a': '400ml', '69f747441a331c9902d3a62b': '680g',
    '69f747441a331c9902d3a62c': '450ml', '69f747441a331c9902d3a62d': '395ml',
    '69f747441a331c9902d3a62e': '50g', '69f747441a331c9902d3a62f': '200g',
    '69f747441a331c9902d3a630': '200g', '69f747441a331c9902d3a631': '200ml',
    '69f747441a331c9902d3a632': '200g', '69f747441a331c9902d3a633': '80 pcs',
    '69f747441a331c9902d3a634': '40 pcs', '69f747441a331c9902d3a635': '72 pcs',
};


const CheckoutScreen = ({ navigation }) => {
    const { cartItems, cartCount, cartTotal, clearCart } = useCart();
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState(null);

    const deliveryFee = cartTotal >= 299 ? 0 : 25;
    const grandTotal = cartTotal + deliveryFee;

  const handleAddressSelect = (addressData) => {
    if (addressData.type === 'current') {
        navigation.navigate('MapSelection', {
            type: 'current',
            onLocationSelect: (locationData) => {
                setSelectedAddress({
                    label: locationData.addressType
                        ? locationData.addressType.charAt(0).toUpperCase() + locationData.addressType.slice(1)
                        : 'Current Location',
                    address: [
                        locationData.addressLine1,
                        locationData.addressLine2,
                        locationData.landmark,
                        locationData.city,
                        locationData.state,
                        locationData.pincode,
                    ].filter(Boolean).join(', '),
                    fullAddress: locationData,
                });
            },
        });
    } else if (addressData.type === 'new') {
        navigation.navigate('MapSelection', {
            type: 'new',
            onLocationSelect: (locationData) => {
                setSelectedAddress({
                    label: locationData.addressType
                        ? locationData.addressType.charAt(0).toUpperCase() + locationData.addressType.slice(1)
                        : 'New Address',
                    address: [
                        locationData.addressLine1,
                        locationData.addressLine2,
                        locationData.landmark,
                        locationData.city,
                        locationData.state,
                        locationData.pincode,
                    ].filter(Boolean).join(', '),
                    fullAddress: locationData,
                });
            },
        });
    } else if (addressData.type === 'saved') {
        const a = addressData.address;
        setSelectedAddress({
            label: a.addressType
                ? a.addressType.charAt(0).toUpperCase() + a.addressType.slice(1)
                : 'Saved Address',
            address: [
                a.addressLine1,
                a.addressLine2,
                a.landmark,
                a.city,
                a.state,
                a.pincode,
            ].filter(Boolean).join(', '),
            fullAddress: a,
        });
    }
};
    const renderItem = ({ item }) => {
        // item from backend: { _id, product: { _id, name, price... }, quantity, price }
        const product = item.product;
        const productId = product?._id;
        const localImage = IMAGE_MAP[product?.productKey];
        const unit = PRODUCT_UNIT_MAP[productId] ?? '';

        return (
            <View style={styles.cartItem}>
                <View style={styles.itemImageWrap}>
                    {localImage ? (
                        <Image source={localImage} style={styles.itemImage} resizeMode="contain" />
                    ) : (
                        <View style={[styles.itemImageWrap, { backgroundColor: '#EEE' }]} />
                    )}
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{product?.name}</Text>
                    <Text style={styles.itemUnit}>{unit}</Text>
                </View>
                <View style={styles.itemRight}>
                    <Text style={styles.itemQty}>×{item.quantity}</Text>
                    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Delivery Address ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>

                    {selectedAddress ? (
                        <View style={styles.addressCard}>
                            <View style={styles.addressLeft}>
                                <View style={styles.addressIconWrap}>
                                    <Icon name="location" size={20} color="#E91E63" />
                                </View>
                                <View style={styles.addressInfo}>
                                    <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                                    <Text style={styles.addressText} numberOfLines={2}>
                                        {selectedAddress.address}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowAddressModal(true)}
                                style={styles.changeBtn}
                            >
                                <Text style={styles.changeBtnText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.addAddressBtn}
                            onPress={() => setShowAddressModal(true)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.addAddressLeft}>
                                <View style={styles.addAddressIcon}>
                                    <Icon name="add" size={20} color="#E91E63" />
                                </View>
                                <Text style={styles.addAddressText}>Add delivery address</Text>
                            </View>
                            <Icon name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Delivery Time ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Time</Text>
                    <View style={styles.deliveryTimeCard}>
                        <View style={styles.deliveryTimeLeft}>
                            <Icon name="time-outline" size={22} color="#4CAF50" />
                            <View style={styles.deliveryTimeInfo}>
                                <Text style={styles.deliveryTimeMain}>15 minutes</Text>
                                <Text style={styles.deliveryTimeSub}>Express delivery</Text>
                            </View>
                        </View>
                        <View style={styles.deliveryTimeBadge}>
                            <Text style={styles.deliveryTimeBadgeText}>Fast</Text>
                        </View>
                    </View>
                </View>

                {/* ── Order Items ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Order Items ({cartCount} item{cartCount > 1 ? 's' : ''})
                    </Text>
                    {cartItems.map((item) => (
                        <View key={item._id}>{renderItem({ item })}</View>
                    ))}
                </View>

                {/* ── Payment Method ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentLeft}>
                            <View style={styles.paymentIcon}>
                                <Icon name="cash-outline" size={20} color="#4CAF50" />
                            </View>
                            <Text style={styles.paymentText}>Cash on Delivery</Text>
                        </View>
                        <View style={styles.paymentSelected}>
                            <Icon name="checkmark-circle" size={20} color="#4CAF50" />
                        </View>
                    </View>
                </View>

                {/* ── Bill Details ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bill Details</Text>
                    <View style={styles.billCard}>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Item total</Text>
                            <Text style={styles.billValue}>₹{cartTotal}</Text>
                        </View>
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Delivery fee</Text>
                            <Text style={[styles.billValue, deliveryFee === 0 && styles.freeText]}>
                                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                            </Text>
                        </View>
                        {deliveryFee === 0 && (
                            <View style={styles.savingsBadge}>
                                <Icon name="pricetag-outline" size={12} color="#2E7D32" />
                                <Text style={styles.savingsText}>You save ₹25 on delivery!</Text>
                            </View>
                        )}
                        <View style={styles.billDivider} />
                        <View style={styles.billRow}>
                            <Text style={styles.billTotal}>To Pay</Text>
                            <Text style={styles.billTotalValue}>₹{grandTotal}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── Place Order Button ── */}
            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <Text style={styles.footerTotal}>₹{grandTotal}</Text>
                    <Text style={styles.footerLabel}>Total payable</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.placeOrderBtn,
                        !selectedAddress && styles.placeOrderBtnDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={async () => {
                        if (!selectedAddress) {
                            setShowAddressModal(true);
                            return;
                        }

                        setIsPlacingOrder(true);
                        try {
                            const token = await AsyncStorage.getItem('token');

                            const orderItems = cartItems.map(item => ({
                                product: item.product._id,

                                productKey: item.product.productKey,
                                unit: item.product.unit,
                                category: item.product.category,

                                name: item.product.name,
                                quantity: item.quantity,
                                price: item.price,
                            }));

                            const response = await fetch(`${BASE_URL}/orders`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    orderItems,
                                    shippingAddress: {
                                        label: selectedAddress.label,
                                        address: selectedAddress.address,
                                    },
                                    paymentMethod: 'Cash on Delivery',
                                    itemsPrice: cartTotal,
                                    taxPrice: 0,
                                    shippingPrice: deliveryFee,
                                    totalPrice: grandTotal,
                                }),
                            });

                            const data = await response.json();

                            if (!response.ok) throw new Error(data.error || 'Failed to place order');

                            setPlacedOrderId(data.data._id);
                            clearCart();
                            setOrderPlaced(true);
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
                        } finally {
                            setIsPlacingOrder(false);
                        }
                    }}
                >
                    {isPlacingOrder ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.placeOrderText}>
                            {selectedAddress ? 'Place Order  →' : 'Add Address to Continue'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Address Modal */}
            <AddressSelectionModal
                visible={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onAddressSelect={(data) => {
                    setShowAddressModal(false);
                    handleAddressSelect(data);
                }}
            />

            <Modal visible={orderPlaced} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.successIconWrap}>
                            <Icon name="checkmark-circle" size={64} color="#4CAF50" />
                        </View>
                        <Text style={styles.modalTitle}>Order Placed! 🎉</Text>
                        <Text style={styles.modalSub}>
                            Your order is confirmed and will be delivered in 15 minutes.
                        </Text>
                        {placedOrderId && (
                            <Text style={styles.modalOrderId}>
                                Order ID: #{placedOrderId.slice(-8).toUpperCase()}
                            </Text>
                        )}
                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => {
                                setOrderPlaced(false);
                                navigation.dispatch(
                                    CommonActions.reset({ index: 0, routes: [{ name: 'MainApp' }] })
                                );
                            }}
                        >
                            <Text style={styles.modalBtnText}>Continue Shopping</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalSecondaryBtn}
                            onPress={() => {
                                setOrderPlaced(false);
                                navigation.dispatch(
                                    CommonActions.reset({ index: 0, routes: [{ name: 'MainApp' }] })
                                );
                                // Navigate to order history after reset settles
                                setTimeout(() => navigation.navigate('OrderHistory'), 300);
                            }}
                        >
                            <Text style={styles.modalSecondaryBtnText}>View Order</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F0EF',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 14,
        backgroundColor: '#F2F0EF',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 3,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
        letterSpacing: -0.4,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 14, paddingTop: 4 },

    // Section
    section: { marginBottom: 16 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#888',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 2,
    },

    // Address card
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    addressLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
    addressIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FCE4EC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    addressInfo: { flex: 1 },
    addressLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111',
        marginBottom: 3,
    },
    addressText: {
        fontSize: 12,
        color: '#777',
        fontWeight: '500',
        lineHeight: 18,
    },
    changeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#E91E63',
        marginLeft: 10,
    },
    changeBtnText: { fontSize: 12, fontWeight: '700', color: '#E91E63' },

    // Add address button
    addAddressBtn: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1.5,
        borderColor: '#FCE4EC',
        borderStyle: 'dashed',
    },
    addAddressLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    addAddressIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FCE4EC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addAddressText: { fontSize: 14, fontWeight: '700', color: '#E91E63' },

    // Delivery time
    deliveryTimeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    deliveryTimeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    deliveryTimeInfo: {},
    deliveryTimeMain: { fontSize: 14, fontWeight: '800', color: '#111' },
    deliveryTimeSub: { fontSize: 11, color: '#999', fontWeight: '500', marginTop: 1 },
    deliveryTimeBadge: {
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    deliveryTimeBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },

    // Cart items
    cartItem: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    itemImageWrap: {
        width: 56,
        height: 56,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemImage: { width: 48, height: 48 },
    itemInfo: { flex: 1 },
    itemName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    itemUnit: { fontSize: 11, color: '#A0AAB4', fontWeight: '500' },
    itemRight: { alignItems: 'flex-end', gap: 4 },
    itemQty: { fontSize: 11, color: '#999', fontWeight: '600' },
    itemPrice: { fontSize: 14, fontWeight: '800', color: '#111' },

    // Payment
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    paymentIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentText: { fontSize: 14, fontWeight: '700', color: '#111' },

    // Bill
    billCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    billLabel: { fontSize: 13, color: '#777', fontWeight: '500' },
    billValue: { fontSize: 13, color: '#111', fontWeight: '700' },
    freeText: { color: '#4CAF50' },
    savingsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    savingsText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
    billDivider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 10 },
    billTotal: { fontSize: 15, fontWeight: '800', color: '#111' },
    billTotalValue: { fontSize: 15, fontWeight: '800', color: '#111' },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        paddingBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 10,
    },
    footerLeft: {},
    footerTotal: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
    footerLabel: { fontSize: 11, color: '#999', fontWeight: '500', marginTop: 1 },
    placeOrderBtn: {
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        paddingHorizontal: 22,
        paddingVertical: 13,
    },
    placeOrderBtnDisabled: { backgroundColor: '#E91E63' },
    placeOrderText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    successIconWrap: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111',
        marginBottom: 8,
        letterSpacing: -0.4,
    },
    modalSub: {
        fontSize: 13,
        color: '#777',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 12,
    },
    modalOrderId: {
        fontSize: 12,
        fontWeight: '700',
        color: '#aaa',
        marginBottom: 24,
        letterSpacing: 0.5,
    },
    modalBtn: {
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
    },
    modalSecondaryBtn: {
        paddingVertical: 10,
    },
    modalSecondaryBtnText: {
        color: '#E91E63',
        fontWeight: '700',
        fontSize: 13,
    },
});

export default CheckoutScreen;