import React, { useCallback, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    FlatList,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon1 from 'react-native-vector-icons/Entypo';
import { resolveImageUrl } from '../../config/apiconfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_CAROUSEL_HEIGHT = 260;

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
        <Text style={styles.relPrice}>Rs.{item.price}</Text>
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
                    <Text style={[styles.relQtyBtnText, { color: accent }]}>-</Text>
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
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const badge = product.badge ? BADGE_COLORS[product.badge] : null;
    const description =
        product.description ||
        'A quality product, freshly sourced and delivered to your door in minutes.';

    const relatedItems = getRelatedItems(allProducts, product.id);

    // Build image sources array for carousel
    const imageSources = [];
    if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
            const uri = img.uri || resolveImageUrl(img.url);
            if (uri) imageSources.push({ uri });
        });
    }
    if (imageSources.length === 0 && product.image) {
        imageSources.push(product.image);
    }
    if (imageSources.length === 0 && product.imageUrl) {
        const resolved = resolveImageUrl(product.imageUrl);
        if (resolved) imageSources.push({ uri: resolved });
    }

    const handleAdd = useCallback((id) => {
        const p = allProducts.find(x => x.id === id) ?? product;
        addItem(p);
    }, [allProducts, product, addItem]);

    const handleRemove = useCallback((id) => {
        const p = allProducts.find(x => x.id === id) ?? product;
        removeItem(p._id);
    }, [allProducts, product, removeItem]);

    const onCarouselScroll = useCallback((e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 24));
        setActiveImageIndex(idx);
    }, []);

    const mainQty = cart[product._id] ?? 0;
    const accent = meta.accent;
    const accentLight = meta.accentLight;
    const hasMultipleImages = imageSources.length > 1;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={18} color="#111" />
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
                {/* Image Carousel */}
                <View style={styles.carouselCard}>
                    {badge && (
                        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.badgeText, { color: badge.text }]}>
                                {product.badge}
                            </Text>
                        </View>
                    )}
                    {imageSources.length > 0 ? (
                        <FlatList
                            data={imageSources}
                            keyExtractor={(_, i) => `img-${i}`}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={onCarouselScroll}
                            renderItem={({ item: src }) => (
                                <View style={[styles.carouselSlide, { backgroundColor: accentLight }]}>
                                    <Image
                                        source={src}
                                        style={styles.carouselImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            )}
                        />
                    ) : (
                        <View style={[styles.carouselSlide, { backgroundColor: accentLight }]}>
                            <View style={styles.detailPlaceholder}>
                                <Text style={styles.detailPlaceholderText}>{product.name.charAt(0)}</Text>
                            </View>
                        </View>
                    )}
                    {/* Dots indicator */}
                    {hasMultipleImages && (
                        <View style={styles.dotsRow}>
                            {imageSources.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        i === activeImageIndex
                                            ? { backgroundColor: accent, width: 18 }
                                            : { backgroundColor: '#D0D0D0' },
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                    {/* Image counter */}
                    {hasMultipleImages && (
                        <View style={styles.imageCounter}>
                            <Text style={styles.imageCounterText}>
                                {activeImageIndex + 1}/{imageSources.length}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View style={styles.infoCard}>
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
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>Rs.{product.discountPrice || product.price}</Text>
                        {product.discountPrice && product.discountPrice < product.price && (
                            <Text style={styles.originalPrice}>Rs.{product.price}</Text>
                        )}
                        {product.discountPercentage > 0 && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>{product.discountPercentage}% OFF</Text>
                            </View>
                        )}
                    </View>

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
                                <Text style={[styles.qtyBtnText, { color: accent }]}>-</Text>
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

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>About this product</Text>
                    <Text style={styles.descText}>{description}</Text>

                    <View style={styles.pillRow}>
                        {[
                            { icon: 'flash-outline', label: '15 min delivery' },
                            { icon: 'return-down-back-outline', label: 'Easy returns' },
                            { icon: 'checkmark-circle-outline', label: 'Quality checked' },
                        ].map(pill => (
                            <View
                                key={pill.label}
                                style={[styles.pill, { backgroundColor: accent + '18' }]}
                            >
                                <Icon name={pill.icon} size={13} color={accent} />
                                <Text style={[styles.pillText, { color: accent }]}>{pill.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Product Details */}
                {(product.brand || product.weight || product.category || product.stock != null) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Product Details</Text>
                        <View style={styles.detailsGrid}>
                            {product.brand ? (
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Brand</Text>
                                    <Text style={styles.detailValue}>{product.brand}</Text>
                                </View>
                            ) : null}
                            {product.weight ? (
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Weight</Text>
                                    <Text style={styles.detailValue}>{product.weight}</Text>
                                </View>
                            ) : null}
                            {product.category ? (
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Category</Text>
                                    <Text style={styles.detailValue}>{product.category}</Text>
                                </View>
                            ) : null}
                            {product.stock != null ? (
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Availability</Text>
                                    <Text style={[styles.detailValue, {
                                        color: product.isOutOfStock || product.stock === 0 ? '#E53935' : '#2E7D32'
                                    }]}>
                                        {product.isOutOfStock || product.stock === 0 ? 'Out of Stock' : 'In Stock'}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                )}

                {/* Thumbnail strip (when multiple images) */}
                {hasMultipleImages && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>All images</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {imageSources.map((src, i) => (
                                <TouchableOpacity key={i} activeOpacity={0.7}>
                                    <View style={[
                                        styles.thumbWrap,
                                        i === activeImageIndex && { borderColor: accent, borderWidth: 2 },
                                    ]}>
                                        <Image source={src} style={styles.thumbImage} resizeMode="contain" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

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
                        <Text style={styles.cartBarTotal}>Rs.{cartTotal}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.cartBarBtn, { backgroundColor: accent }]}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <Text style={styles.cartBarBtnText}>View Cart</Text>
                        <Icon name="arrow-forward" size={16} color="#fff" />
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

    // Image Carousel
    carouselCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    carouselSlide: {
        width: SCREEN_WIDTH - 24,
        height: IMAGE_CAROUSEL_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    carouselImage: {
        width: SCREEN_WIDTH - 80,
        height: IMAGE_CAROUSEL_HEIGHT - 40,
    },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 10,
    },
    badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    detailPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
    detailPlaceholderText: { fontSize: 40, fontWeight: '800', color: '#CCC' },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        paddingBottom: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    imageCounterText: { fontSize: 10, color: '#fff', fontWeight: '700' },

    // Info card
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    wishlistBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    productName: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.3, lineHeight: 24 },
    productUnit: { fontSize: 12, color: '#A0AAB4', fontWeight: '500', marginTop: 2, marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    price: { fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
    originalPrice: { fontSize: 15, color: '#B0B0B0', textDecorationLine: 'line-through', fontWeight: '600' },
    discountBadge: { backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    discountText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
    addBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
    addBtnText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    qtyBtn: { paddingHorizontal: 16, paddingVertical: 9 },
    qtyBtnText: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
    qtyNum: { fontSize: 15, fontWeight: '800', minWidth: 24, textAlign: 'center' },

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
    sectionLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10, letterSpacing: -0.1 },
    descText: { fontSize: 13, color: '#666', lineHeight: 20, fontWeight: '400' },
    pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 14 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    pillText: { fontSize: 11, fontWeight: '700' },

    // Product Details Grid
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    detailItem: {
        width: '46%',
        backgroundColor: '#F8F8F8',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    detailLabel: { fontSize: 10, fontWeight: '600', color: '#999', letterSpacing: 0.3, marginBottom: 3, textTransform: 'uppercase' },
    detailValue: { fontSize: 13, fontWeight: '700', color: '#333' },

    // Thumbnails
    thumbWrap: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        overflow: 'hidden',
    },
    thumbImage: { width: 52, height: 52 },

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
    cartBarBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
    cartBarBtnText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});

export default ProductDetailScreen;
