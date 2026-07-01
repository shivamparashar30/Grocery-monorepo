import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon1 from 'react-native-vector-icons/Entypo';
import { BASE_URL, resolveImageUrl } from '../../config/apiconfig';

const BADGE_COLORS = {
    Fresh: { bg: '#E8F5E9', text: '#2E7D32' },
    Popular: { bg: '#E3F2FD', text: '#1565C0' },
    Premium: { bg: '#FFF8E1', text: '#F57F17' },
    Seasonal: { bg: '#FCE4EC', text: '#880E4F' },
    Healthy: { bg: '#F1F8E9', text: '#558B2F' },
    Spicy: { bg: '#FBE9E7', text: '#BF360C' },
    New: { bg: '#E8EAF6', text: '#283593' },
};

const CATEGORY_META = {
    'Vegetables & Fruits': { accent: '#4CAF50', accentLight: '#E8F5E9', subtitle: 'Farm fresh, delivered in 15 min' },
    'Dairy, Eggs & Bread': { accent: '#FDD835', accentLight: '#FFFDE7', subtitle: 'Fresh dairy, every morning' },
    'Munchies': { accent: '#FF7043', accentLight: '#FBE9E7', subtitle: 'Snack attack? We got you' },
    'Cold Drinks & Juices': { accent: '#29B6F6', accentLight: '#E1F5FE', subtitle: 'Chilled & refreshing, always' },
    'Noodles & Instant Food': { accent: '#AB47BC', accentLight: '#F3E5F5', subtitle: 'Ready in minutes, loved always' },
    'Bakery & Biscuits': { accent: '#FF9800', accentLight: '#FFF3E0', subtitle: 'Crispy, crunchy & freshly baked' },
    'Sweet Tooth': { accent: '#E91E63', accentLight: '#FCE4EC', subtitle: 'Life is sweeter with every bite' },
    'Atta, Rice & Dal': { accent: '#8BC34A', accentLight: '#F1F8E9', subtitle: 'Kitchen staples, always stocked' },
    'Sauces & Spreads': { accent: '#5C6BC0', accentLight: '#E8EAF6', subtitle: 'Add flavour to every meal' },
    'Baby Care': { accent: '#F48FB1', accentLight: '#FCE4EC', subtitle: 'Gentle care for your little one' },
    'Winter': { accent: '#1A6FA0', accentLight: '#C8E8F8', subtitle: 'Stay warm this season' },
    'Electronics': { accent: '#6A3AAA', accentLight: '#E4D5F7', subtitle: 'Latest gadgets & tech' },
    'Beauty': { accent: '#B83060', accentLight: '#FAD6E8', subtitle: 'Skincare, makeup & more' },
    'Decor': { accent: '#2A7040', accentLight: '#D5EED8', subtitle: 'Make your space beautiful' },
    'Kids': { accent: '#C05020', accentLight: '#FDE0CC', subtitle: 'Fun & care for little ones' },
};

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

const ProductCard = ({ item, accent, onAdd, onRemove, quantity, onPress, wishlisted, onToggleWishlist }) => {
    const badge = item.badge ? BADGE_COLORS[item.badge] : null;

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.92}
            onPress={() => onPress(item)}
        >
            {badge && (
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{item.badge}</Text>
                </View>
            )}
            <TouchableOpacity
                style={styles.heartBtn}
                activeOpacity={0.7}
                onPress={(e) => { e.stopPropagation?.(); onToggleWishlist(item); }}
            >
                <Icon name={wishlisted ? 'heart' : 'heart-outline'} size={16} color={wishlisted ? '#E24B4A' : '#CCC'} />
            </TouchableOpacity>
            <View style={styles.imageWrap}>
                {item.image ? (
                    <Image source={item.image} style={styles.productImage} resizeMode="contain" />
                ) : (
                    <View style={styles.imgPlaceholder}>
                        <Text style={styles.imgPlaceholderText}>{item.name.charAt(0)}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productUnit}>{item.unit}</Text>

            <View style={styles.cardFooter}>
                <Text style={styles.price}>₹{item.price}</Text>

                {quantity === 0 ? (
                    <TouchableOpacity
                        style={[styles.addBtn, { borderColor: accent }]}
                        onPress={(e) => { e.stopPropagation?.(); onAdd(item.id); }}
                        activeOpacity={0.75}
                    >
                        <Text style={[styles.addBtnText, { color: accent }]}>ADD</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.qtyControl, { borderColor: accent }]}>
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); onRemove(item.id); }}
                            style={styles.qtyBtn}
                        >
                            <Text style={[styles.qtyBtnText, { color: accent }]}>−</Text>
                        </TouchableOpacity>
                        <Text style={[styles.qtyNum, { color: accent }]}>{quantity}</Text>
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); onAdd(item.id); }}
                            style={styles.qtyBtn}
                        >
                            <Text style={[styles.qtyBtnText, { color: accent }]}>+</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const CategoryProductsScreen = ({ route, navigation }) => {
    const { categoryName = 'Vegetables & Fruits' } = route?.params ?? {};
    const meta = CATEGORY_META[categoryName] ?? { accent: '#4CAF50', accentLight: '#E8F5E9', subtitle: '' };
    const { cart, addItem, removeItem, cartCount, cartTotal } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [apiProducts, setApiProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${BASE_URL}/products?category=${encodeURIComponent(categoryName)}`)
            .then(r => r.text())
            .then(text => {
                const d = JSON.parse(text);
                if (d.success) setApiProducts(d.products);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [categoryName]);

    const products = apiProducts.map(p => {
        const localImg = IMAGE_MAP[p.productKey];
        const serverImg = p.imageUrl ? { uri: resolveImageUrl(p.imageUrl) } : null;
        const allImages = (p.images || [])
            .sort((a, b) => a.order - b.order)
            .map(img => ({ ...img, uri: resolveImageUrl(img.url) }));
        return {
            ...p,
            id: p.productKey,
            image: localImg || serverImg,
            images: allImages,
        };
    });

    const handleAdd = useCallback((id) => {
        const product = products.find(p => p.id === id);
        addItem(product);
    }, [products, addItem]);

    const handleRemove = useCallback((id) => {
        const product = products.find(p => p.id === id);
        removeItem(product._id);
    }, [products, removeItem]);

    // Navigate to the detail screen, passing the full products list for related items
    const handleCardPress = useCallback((item) => {
        navigation.navigate('ProductDetailScreen', {
            product: item,
            categoryName,
            products,
        });
    }, [navigation, categoryName, products]);

    const renderItem = ({ item }) => (
        <ProductCard
            item={item}
            accent={meta.accent}
            quantity={cart[item._id] ?? 0}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onPress={handleCardPress}
            wishlisted={isInWishlist(item.productKey || item._id)}
            onToggleWishlist={toggleWishlist}
        />
    );

    if (loading) return (
        <SafeAreaView style={styles.container}>
            <Text style={{ padding: 20, color: '#666' }}>Loading...</Text>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{categoryName}</Text>
                    <Text style={styles.headerSubtitle}>{meta.subtitle}</Text>
                </View>
                <TouchableOpacity style={styles.headerCartWrap} onPress={() => navigation?.navigate('Cart')} activeOpacity={0.8}>
                    <Icon1 name="shopping-cart" size={24} color="#1A1A1A" />
                    {cartCount > 0 && (
                        <View style={[styles.cartBadge, { backgroundColor: meta.accent }]}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={products}
                keyExtractor={(item) => item.productKey}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={[styles.listContent, cartCount > 0 && { paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
            />

            {cartCount > 0 && (
                <View style={styles.cartBar}>
                    <View>
                        <Text style={styles.cartBarCount}>{cartCount} item{cartCount > 1 ? 's' : ''}</Text>
                        <Text style={styles.cartBarTotal}>₹{cartTotal}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.cartBarBtn, { backgroundColor: meta.accent }]}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <Text style={styles.cartBarBtnText}>View Cart  →</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F0EF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 14,
        backgroundColor: '#F2F0EF',
        gap: 10,
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
    backArrow: { fontSize: 18, color: '#111', marginTop: -1 },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.4 },
    headerSubtitle: { fontSize: 11, color: '#7A9BAA', fontWeight: '500', marginTop: 1 },
    headerCartWrap: { position: 'relative' },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    cartBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
    listContent: { paddingHorizontal: 10, paddingBottom: 20 },
    row: { justifyContent: 'space-between' },
    card: {
        width: '48.5%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 10,
        left: 10,
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        zIndex: 1,
    },
    heartBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    imgPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imgPlaceholderText: { fontSize: 24, fontWeight: '800', color: '#CCC' },
    badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
    imageWrap: {
        width: '100%',
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    productImage: { width: 90, height: 90 },
    productName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.2, marginBottom: 2 },
    productUnit: { fontSize: 11, color: '#A0AAB4', fontWeight: '500', marginBottom: 10 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    price: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
    addBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
    addBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 8, overflow: 'hidden' },
    qtyBtn: { paddingHorizontal: 8, paddingVertical: 4 },
    qtyBtnText: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
    qtyNum: { fontSize: 13, fontWeight: '800', minWidth: 16, textAlign: 'center' },
    cartBar: {
        position: 'absolute',
        bottom: 16,
        left: 14,
        right: 14,
        backgroundColor: '#fff',
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },
    cartBarCount: { fontSize: 11, color: '#999', fontWeight: '600' },
    cartBarTotal: { fontSize: 17, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
    cartBarBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
    cartBarBtnText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});

export default CategoryProductsScreen;