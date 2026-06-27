import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    FlatList,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon1 from 'react-native-vector-icons/Entypo';

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
    'Vegetables & Fruits': { accent: '#4CAF50', accentLight: '#E8F5E9' },
    'Dairy, Eggs & Bread': { accent: '#FDD835', accentLight: '#FFFDE7' },
    'Munchies': { accent: '#FF7043', accentLight: '#FBE9E7' },
    'Cold Drinks & Juices': { accent: '#29B6F6', accentLight: '#E1F5FE' },
    'Noodles & Instant Food': { accent: '#AB47BC', accentLight: '#F3E5F5' },
    'Bakery & Biscuits': { accent: '#FF9800', accentLight: '#FFF3E0' },
    'Sweet Tooth': { accent: '#E91E63', accentLight: '#FCE4EC' },
    'Atta, Rice & Dal': { accent: '#8BC34A', accentLight: '#F1F8E9' },
    'Sauces & Spreads': { accent: '#5C6BC0', accentLight: '#E8EAF6' },
    'Baby Care': { accent: '#F48FB1', accentLight: '#FCE4EC' },
    'Winter': { accent: '#1A6FA0', accentLight: '#C8E8F8' },
    'Electronics': { accent: '#6A3AAA', accentLight: '#E4D5F7' },
    'Beauty': { accent: '#B83060', accentLight: '#FAD6E8' },
    'Decor': { accent: '#2A7040', accentLight: '#D5EED8' },
    'Kids': { accent: '#C05020', accentLight: '#FDE0CC' },
};

// Related items are drawn from the same products list, excluding the current product.
// Limit to 8 to keep the horizontal scroll manageable.
const getRelatedItems = (products, currentId) =>
    products.filter(p => p.id !== currentId).slice(0, 8);

const RelatedCard = ({ item, accent, quantity, onAdd, onRemove }) => (
    <View style={styles.relCard}>
        {item.image ? (
            <Image source={item.image} style={styles.relImage} resizeMode="contain" />
        ) : (
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#CCC' }}>{item.name?.charAt(0)}</Text>
            </View>
        )}
        <Text style={styles.relName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.relUnit} numberOfLines={1}>{item.unit}</Text>
        <Text style={styles.relPrice}>₹{item.price}</Text>
        {quantity === 0 ? (
            <TouchableOpacity
                style={[styles.relAddBtn, { borderColor: accent }]}
                onPress={() => onAdd(item.id)}
                activeOpacity={0.75}
            >
                <Text style={[styles.relAddBtnText, { color: accent }]}>ADD</Text>
            </TouchableOpacity>
        ) : (
            <View style={[styles.relQtyControl, { borderColor: accent }]}>
                <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.relQtyBtn}>
                    <Text style={[styles.relQtyBtnText, { color: accent }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.relQtyNum, { color: accent }]}>{quantity}</Text>
                <TouchableOpacity onPress={() => onAdd(item.id)} style={styles.relQtyBtn}>
                    <Text style={[styles.relQtyBtnText, { color: accent }]}>+</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
);

const ProductDetailScreen = ({ route, navigation }) => {
    const { product, categoryName, products: allProducts = [] } = route.params;
    const meta = CATEGORY_META[categoryName] ?? { accent: '#4CAF50', accentLight: '#E8F5E9' };
    const { cart, addItem, removeItem, cartCount, cartTotal } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const wishlisted = isInWishlist(product.productKey || product._id);

    const badge = product.badge ? BADGE_COLORS[product.badge] : null;
    const description =
        product.description ||
        'A quality product, freshly sourced and delivered to your door in minutes.';

    const relatedItems = getRelatedItems(allProducts, product.id);

    const handleAdd = useCallback((id) => {
        const p = allProducts.find(x => x.id === id) ?? product;
        addItem(p);
    }, [allProducts, product, addItem]);

    const handleRemove = useCallback((id) => {
        const p = allProducts.find(x => x.id === id) ?? product;
        removeItem(p._id);
    }, [allProducts, product, removeItem]);

    const mainQty = cart[product._id] ?? 0;
    const accent = meta.accent;
    const accentLight = meta.accentLight;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <TouchableOpacity
                    style={styles.headerCartWrap}
                    onPress={() => navigation?.navigate('Cart')}
                    activeOpacity={0.8}
                >
                    <Icon1 name="shopping-cart" size={24} color="#1A1A1A" />
                    {cartCount > 0 && (
                        <View style={[styles.cartBadge, { backgroundColor: accent }]}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, cartCount > 0 && { paddingBottom: 100 }]}
            >
                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <View style={[styles.imageContainer, { backgroundColor: accentLight }]}>
                        {badge && (
                            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                <Text style={[styles.badgeText, { color: badge.text }]}>
                                    {product.badge}
                                </Text>
                            </View>
                        )}
                        {product.image ? (
                            <Image
                                source={product.image}
                                style={styles.productImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.detailPlaceholder}>
                                <Text style={styles.detailPlaceholderText}>{product.name.charAt(0)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.infoBlock}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.productName, { flex: 1 }]}>{product.name}</Text>
                            <TouchableOpacity
                                style={[styles.wishlistBtn, wishlisted && { backgroundColor: '#FFF0F0' }]}
                                onPress={() => toggleWishlist(product)}
                                activeOpacity={0.7}
                            >
                                <Icon name={wishlisted ? 'heart' : 'heart-outline'} size={18} color={wishlisted ? '#E24B4A' : '#999'} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.productUnit}>{product.unit}</Text>
                        <Text style={styles.price}>₹{product.price}</Text>

                        {mainQty === 0 ? (
                            <TouchableOpacity
                                style={[styles.addBtn, { backgroundColor: accent }]}
                                onPress={() => handleAdd(product.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.addBtnText}>ADD TO CART</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.qtyControl, { borderColor: accent }]}>
                                <TouchableOpacity
                                    onPress={() => handleRemove(product.id)}
                                    style={styles.qtyBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.qtyBtnText, { color: accent }]}>−</Text>
                                </TouchableOpacity>
                                <Text style={[styles.qtyNum, { color: accent }]}>{mainQty}</Text>
                                <TouchableOpacity
                                    onPress={() => handleAdd(product.id)}
                                    style={styles.qtyBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.qtyBtnText, { color: accent }]}>+</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>About this product</Text>
                    <Text style={styles.descText}>{description}</Text>

                    <View style={styles.pillRow}>
                        {[
                            { icon: '⚡', label: '15 min delivery' },
                            { icon: '↩', label: 'Easy returns' },
                            { icon: '✓', label: 'Quality checked' },
                        ].map(pill => (
                            <View
                                key={pill.label}
                                style={[styles.pill, { backgroundColor: accent + '18' }]}
                            >
                                <Text style={styles.pillIcon}>{pill.icon}</Text>
                                <Text style={[styles.pillText, { color: accent }]}>{pill.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Related Items */}
                {relatedItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>You might also like</Text>
                        <FlatList
                            data={relatedItems}
                            keyExtractor={item => item.productKey ?? item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                            renderItem={({ item }) => (
                                <RelatedCard
                                    item={item}
                                    accent={accent}
                                    quantity={cart[item._id] ?? 0}
                                    onAdd={handleAdd}
                                    onRemove={handleRemove}
                                />
                            )}
                        />
                    </View>
                )}
            </ScrollView>

            {/* Sticky cart bar */}
            {cartCount > 0 && (
                <View style={styles.cartBar}>
                    <View>
                        <Text style={styles.cartBarCount}>
                            {cartCount} item{cartCount > 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.cartBarTotal}>₹{cartTotal}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.cartBarBtn, { backgroundColor: accent }]}
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
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.4 },
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

    scrollContent: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24, gap: 10 },

    // Hero Card
    heroCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 14,
        flexDirection: 'row',
        gap: 14,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    imageContainer: {
        width: 130,
        height: 130,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
    },
    badge: {
        position: 'absolute',
        top: 8,
        left: 8,
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        zIndex: 1,
    },
    badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
    productImage: { width: 100, height: 100 },
    detailPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
    detailPlaceholderText: { fontSize: 32, fontWeight: '800', color: '#CCC' },
    nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    wishlistBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    infoBlock: { flex: 1, paddingTop: 4, gap: 4 },
    productName: { fontSize: 16, fontWeight: '800', color: '#111', letterSpacing: -0.3, lineHeight: 22 },
    productUnit: { fontSize: 12, color: '#A0AAB4', fontWeight: '500', marginBottom: 2 },
    price: { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: -0.5, marginBottom: 10 },
    addBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
    addBtnText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 10,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    qtyBtn: { paddingHorizontal: 14, paddingVertical: 7 },
    qtyBtnText: { fontSize: 18, fontWeight: '700', lineHeight: 22 },
    qtyNum: { fontSize: 14, fontWeight: '800', minWidth: 22, textAlign: 'center' },

    // Sections
    section: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8, letterSpacing: -0.1 },
    descText: { fontSize: 13, color: '#666', lineHeight: 20, fontWeight: '400' },
    pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 14 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    pillIcon: { fontSize: 11 },
    pillText: { fontSize: 11, fontWeight: '700' },

    // Related cards
    relCard: {
        width: 100,
        backgroundColor: '#F7F7F7',
        borderRadius: 14,
        padding: 10,
        alignItems: 'center',
    },
    relImage: { width: 60, height: 60, marginBottom: 6 },
    relName: { fontSize: 11, fontWeight: '700', color: '#111', textAlign: 'center', lineHeight: 14, marginBottom: 2 },
    relUnit: { fontSize: 9, color: '#A0AAB4', fontWeight: '500', textAlign: 'center', marginBottom: 4 },
    relPrice: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 7 },
    relAddBtn: { borderWidth: 1.5, borderRadius: 7, paddingHorizontal: 14, paddingVertical: 4, width: '100%', alignItems: 'center' },
    relAddBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    relQtyControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 7, overflow: 'hidden', width: '100%', justifyContent: 'space-between' },
    relQtyBtn: { paddingHorizontal: 8, paddingVertical: 3 },
    relQtyBtnText: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
    relQtyNum: { fontSize: 11, fontWeight: '800', textAlign: 'center', minWidth: 14 },

    // Cart bar
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

export default ProductDetailScreen;