import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  StatusBar,
  Animated,
  Image,
  Keyboard,
  StyleSheet,
  Platform,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon1 from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import AddressSelectionModal from './Homescreen/AddressSelectionModal';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAddress } from '../context/AddressContext';
import { useWishlist } from '../context/WishlistContext';
import { BASE_URL, resolveImageUrl } from '../config/apiconfig';
import IMAGE_MAP from '../utils/imageMap';
import { hapticAddToCart, hapticIncrement, hapticDecrement, hapticRemoved, hapticTick } from '../utils/haptics';

const SNOW_ANIMS_COUNT = 6;

// ─── Design Tokens ───────────────────────────────────────────────────────────
const COLORS = {
  bg: '#F5F4F0', card: '#FFFFFF', text: '#111111', textSub: '#888888',
  textMuted: '#BBBBBB', border: '#EBEBEB', green: '#2BB77D',
  greenLight: '#E8F8F1', red: '#E24B4A', ink: '#1A1A1A',
};

const CATEGORY_GRADIENTS = {
  All:         ['#DBF3F7', '#BDE8EF'],
  Winter:      ['#C8E8F8', '#A8D4F2'],
  Electronics: ['#E4D5F7', '#D0B8F0'],
  Beauty:      ['#FAD6E8', '#F5B5D2'],
  Decor:       ['#D5EED8', '#B8E4BC'],
  Kids:        ['#FDE0CC', '#FAC8A8'],
};

const CATEGORY_ACCENT = {
  All:         '#1A8A9A',
  Winter:      '#1A6FA0',
  Electronics: '#6A3AAA',
  Beauty:      '#B83060',
  Decor:       '#2A7040',
  Kids:        '#C05020',
};

// Color map for product icon placeholders (when no image)
const PRODUCT_ICON_COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7',
  '#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const renderIcon = (iconName, iconType, size, color) => {
  switch (iconType) {
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
    case 'FontAwesome5':
      return <FontAwesome5 name={iconName} size={size} color={color} />;
    case 'MaterialIcons':
      return <MaterialIcons name={iconName} size={size} color={color} />;
    default:
      return <Icon name={iconName} size={size} color={color} />;
  }
};

const getPlaceholderColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PRODUCT_ICON_COLORS[Math.abs(hash) % PRODUCT_ICON_COLORS.length];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle, onSeeAll }) => (
  <View style={s.sectionHeader}>
    <View>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={s.sectionSub}>{subtitle}</Text> : null}
    </View>
    {onSeeAll && (
      <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll} activeOpacity={0.7}>
        <Text style={s.seeAllText}>View all</Text>
        <Icon name="arrow-forward" size={13} color={COLORS.textSub} />
      </TouchableOpacity>
    )}
  </View>
);

const BannerCard = ({ item, width, onPress }) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
    <LinearGradient
      colors={item.gradient}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[s.bannerCard, { width }]}
    >
      {item.badge && (
        <View style={s.bannerBadge}>
          <Text style={s.bannerBadgeText}>{item.badge}</Text>
        </View>
      )}
      <Text style={s.bannerTitle}>{item.title}</Text>
      {item.subtitle ? <Text style={s.bannerSub}>{item.subtitle}</Text> : null}
    </LinearGradient>
  </TouchableOpacity>
);

// ── Mini-carousel for product cards (PanResponder-driven) ────────────────────
const CardCarousel = React.memo(({ images, width, height }) => {
  const count = images.length;
  const idxRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [activeIdx, setActiveIdx] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      // Capture horizontal gestures before the parent FlatList can
      onMoveShouldSetPanResponder: (_, g) =>
        count > 1 && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        count > 1 && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false, // don't let parent steal
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        translateX.setOffset(-idxRef.current * width);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        // Clamp so it can't scroll beyond first/last
        const raw = g.dx;
        const curOffset = -idxRef.current * width;
        const combined = curOffset + raw;
        const clamped = Math.max(-(count - 1) * width, Math.min(0, combined));
        translateX.setOffset(0);
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        let newIdx = idxRef.current;
        if (g.dx < -width * 0.2 || g.vx < -0.4) newIdx = Math.min(idxRef.current + 1, count - 1);
        else if (g.dx > width * 0.2 || g.vx > 0.4) newIdx = Math.max(idxRef.current - 1, 0);

        if (newIdx !== idxRef.current) hapticTick();
        idxRef.current = newIdx;
        setActiveIdx(newIdx);
        Animated.spring(translateX, {
          toValue: -newIdx * width,
          friction: 9,
          tension: 50,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={{ width, height, overflow: 'hidden' }} {...panResponder.panHandlers}>
      <Animated.View
        style={{
          flexDirection: 'row',
          width: width * count,
          height,
          transform: [{ translateX }],
        }}
      >
        {images.map((src, i) => (
          <View key={i} style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
            <Image source={src} style={s.productImg} resizeMode="contain" />
          </View>
        ))}
      </Animated.View>
      {count > 1 && (
        <View style={s.carouselDots}>
          {images.map((_, i) => (
            <View key={i} style={[s.carouselDot, activeIdx === i && s.carouselDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
});

const ProductCard = ({ item, cardWidth, onPress }) => {
  const { cart, addItem, removeItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [imgError, setImgError] = useState(false);
  const wishlisted = isInWishlist(item.productKey || item._id);
  const placeholderBg = getPlaceholderColor(item.name);
  const qty = cart[item._id] || 0;

  // Bounce animation on qty text when value changes
  const qtyBounce = useRef(new Animated.Value(1)).current;
  const prevQtyRef = useRef(qty);
  useEffect(() => {
    if (qty > 0 && qty !== prevQtyRef.current) {
      qtyBounce.setValue(0.75);
      Animated.spring(qtyBounce, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
    }
    prevQtyRef.current = qty;
  }, [qty]);

  // Build all image sources (server images → local fallback → imageUrl fallback)
  const imageSources = useMemo(() => {
    const sources = [];
    if (item.images?.length > 0) {
      item.images.forEach(img => {
        const url = resolveImageUrl(img.url);
        if (url) sources.push({ uri: url });
      });
    }
    if (sources.length === 0) {
      const local = IMAGE_MAP[item.productKey];
      if (local) sources.push(local);
    }
    if (sources.length === 0 && item.imageUrl) {
      const resolved = resolveImageUrl(item.imageUrl);
      if (resolved) sources.push({ uri: resolved });
    }
    return sources;
  }, [item.images, item.productKey, item.imageUrl]);

  const handleAddToCart = useCallback(() => {
    hapticAddToCart();
    addItem(item);
  }, [item, addItem]);

  const handleIncrement = useCallback(() => {
    hapticIncrement();
    addItem(item);
  }, [item, addItem]);

  const handleRemoveFromCart = useCallback(() => {
    if (qty === 1) {
      hapticRemoved();
    } else {
      hapticDecrement();
    }
    removeItem(item._id);
  }, [qty, item._id, removeItem]);

  return (
    <TouchableOpacity
      style={[s.productCard, { width: cardWidth }]}
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
    >
      <View style={[s.productImgWrap, { backgroundColor: imageSources.length ? '#F7F6F2' : placeholderBg + '20' }]}>
        {item.badge && (
          <View style={s.productTag}>
            <Text style={s.productTagText}>{item.badge}</Text>
          </View>
        )}
        {imageSources.length > 0 ? (
          imageSources.length > 1 ? (
            <CardCarousel images={imageSources} width={cardWidth} height={115} />
          ) : (
            <Image source={imageSources[0]} style={s.productImg} resizeMode="contain" onError={() => setImgError(true)} />
          )
        ) : (
          <View style={[s.productPlaceholder, { backgroundColor: placeholderBg + '30' }]}>
            {item.icon ? (
              renderIcon(item.icon, item.iconType || 'Ionicons', 32, placeholderBg)
            ) : (
              <Text style={[s.productPlaceholderText, { color: placeholderBg }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        )}
        <TouchableOpacity style={s.productHeart} activeOpacity={0.7} onPress={() => toggleWishlist(item)}>
          <Icon name={wishlisted ? 'heart' : 'heart-outline'} size={16} color={wishlisted ? '#E24B4A' : COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={s.productInfo}>
        <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
        <View style={s.productPriceRow}>
          <Text style={s.productPrice}>Rs.{item.discountPrice || item.price}</Text>
          {item.discountPrice && item.discountPrice < item.price && (
            <Text style={s.productOrigPrice}>Rs.{item.price}</Text>
          )}
          <Text style={s.productUnit}>{item.unit}</Text>
        </View>
        {qty > 0 ? (
          <View style={s.qtyRow}>
            <TouchableOpacity style={s.qtyBtn} onPress={handleRemoveFromCart} activeOpacity={0.7}>
              <Icon name="remove" size={16} color="#fff" />
            </TouchableOpacity>
            <Animated.Text style={[s.qtyText, { transform: [{ scale: qtyBounce }] }]}>{qty}</Animated.Text>
            <TouchableOpacity style={s.qtyBtn} onPress={handleIncrement} activeOpacity={0.7}>
              <Icon name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.addBtn} onPress={handleAddToCart} activeOpacity={0.8}>
            <Text style={s.addBtnText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const FreqCard = ({ item, cardWidth, onPress }) => (
  <TouchableOpacity style={[s.freqCard, { width: cardWidth }]} activeOpacity={0.85} onPress={onPress}>
    <View style={s.freqImgs}>
      {item.items.map((p) => {
        const img = IMAGE_MAP[p.productKey];
        return (
          <View key={p.id} style={s.freqImgBox}>
            {img && <Image source={img} style={s.freqImg} resizeMode="contain" />}
          </View>
        );
      })}
      {item.moreCount ? (
        <View style={s.freqMore}>
          <Text style={s.freqMoreText}>+{item.moreCount}</Text>
        </View>
      ) : null}
    </View>
    <Text style={s.freqLabel} numberOfLines={2}>{item.title}</Text>
    <View style={s.freqArrow}>
      <Icon name="arrow-forward" size={13} color={COLORS.textSub} />
    </View>
  </TouchableOpacity>
);

const PromoStrip = ({ accent }) => (
  <View style={s.promoStrip}>
    <View style={[s.promoIconWrap, { backgroundColor: accent + '18' }]}>
      <Icon name="ticket-outline" size={22} color={accent} />
    </View>
    <View style={s.promoText}>
      <Text style={s.promoTitle}>Movie Voucher worth Rs.125</Text>
      <Text style={s.promoSub}>On orders above Rs.199</Text>
    </View>
    <View style={s.promoActions}>
      <Icon name="chevron-forward" size={18} color={COLORS.textSub} />
      <TouchableOpacity style={s.promoClose} activeOpacity={0.7}>
        <Icon name="close" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '1', name: 'All',         icon: 'grid',          iconType: 'Ionicons' },
  { id: '2', name: 'Winter',      icon: 'snow',          iconType: 'Ionicons' },
  { id: '3', name: 'Electronics', icon: 'hardware-chip', iconType: 'Ionicons' },
  { id: '4', name: 'Beauty',      icon: 'rose',          iconType: 'Ionicons' },
  { id: '5', name: 'Decor',       icon: 'bulb',          iconType: 'Ionicons' },
  { id: '6', name: 'Kids',        icon: 'balloon',       iconType: 'Ionicons' },
];

const FEATURED_BANNERS = {
  All: [
    { id: '1', title: 'Newly\nLaunched',   badge: 'For You',  subtitle: 'Fresh arrivals',     gradient: ['#1D8A7A', '#0D5D53'], category: 'All' },
    { id: '2', title: 'Exotic\nNuts',      badge: 'Featured', subtitle: 'Imported premium',   gradient: ['#3B2A1A', '#1E1409'], category: 'All' },
    { id: '3', title: 'Major\nDiscounts',  badge: 'Sale',     subtitle: 'Up to 40% off',      gradient: ['#4A6B38', '#2D4A1E'], category: 'All' },
  ],
  Winter: [
    { id: '1', title: 'Warm\nBlankets',    badge: 'Cozy',     subtitle: 'Premium quilts',     gradient: ['#1D4E6E', '#0D2D45'], category: 'Winter' },
    { id: '2', title: 'Hot\nBeverages',    badge: 'Hot Pick', subtitle: 'Stay warm',           gradient: ['#2C1810', '#1A0F09'], category: 'Winter' },
    { id: '3', title: 'Winter\nWear',      badge: 'Trending', subtitle: 'Jackets & sweaters', gradient: ['#8E0038', '#6D0029'], category: 'Winter' },
  ],
  Electronics: [
    { id: '1', title: 'Top\nGadgets',      badge: 'New',      subtitle: 'Latest arrivals',    gradient: ['#5A3580', '#361D55'], category: 'Electronics' },
    { id: '2', title: 'Best\nDeals',       badge: 'Sale',     subtitle: 'Up to 50% off',      gradient: ['#2A4080', '#162450'], category: 'Electronics' },
    { id: '3', title: 'Smart\nWearables',  badge: 'Trending', subtitle: 'Watches & bands',    gradient: ['#1B5E20', '#0D3B10'], category: 'Electronics' },
  ],
  Beauty: [
    { id: '1', title: 'Glow Up',           badge: 'Trending', subtitle: 'Bestselling skincare',gradient: ['#B8345A', '#7A1C35'], category: 'Beauty' },
    { id: '2', title: 'Fragrance\nFest',   badge: 'Premium',  subtitle: 'Top perfumes',        gradient: ['#8A2050', '#5A1030'], category: 'Beauty' },
    { id: '3', title: 'Hair\nCare',        badge: 'Essential',subtitle: 'Shampoo & more',      gradient: ['#4A148C', '#2C0D54'], category: 'Beauty' },
  ],
  Decor: [
    { id: '1', title: 'Home\nVibes',       badge: 'New',      subtitle: 'Fresh decor picks',  gradient: ['#2D6040', '#1A3E28'], category: 'Decor' },
    { id: '2', title: 'Light Up',          badge: 'Featured', subtitle: 'Lamps & fairy lights',gradient: ['#4A7A30', '#2A5018'], category: 'Decor' },
    { id: '3', title: 'Cozy\nCorners',     badge: 'Trending', subtitle: 'Cushions & throws',  gradient: ['#5D4037', '#3E2723'], category: 'Decor' },
  ],
  Kids: [
    { id: '1', title: 'Fun Toys',          badge: 'New',      subtitle: 'Hours of fun',       gradient: ['#C04A1A', '#8A2E0A'], category: 'Kids' },
    { id: '2', title: 'Baby\nEssentials',  badge: 'Trusted',  subtitle: 'Diapers & wipes',    gradient: ['#E07030', '#B04A18'], category: 'Kids' },
    { id: '3', title: 'Kid Snacks',        badge: 'Yummy',    subtitle: 'Healthy & tasty',    gradient: ['#1565C0', '#0D47A1'], category: 'Kids' },
  ],
};

const FREQUENTLY_BOUGHT = [
  { id: '1', title: 'Favourites',          items: [{ id: '1', productKey: 'c1' },  { id: '2', productKey: 'n4' }] },
  { id: '2', title: 'Chips & Namkeen',     items: [{ id: '1', productKey: 'm1' },  { id: '2', productKey: 'm5' }], moreCount: 2 },
  { id: '3', title: 'Bread & Eggs',        items: [{ id: '1', productKey: 'd10' }, { id: '2', productKey: 'd7' }] },
  { id: '4', title: 'Instant Food',        items: [{ id: '1', productKey: 'n4' },  { id: '2', productKey: 'n8' }] },
  { id: '5', title: 'Milk, Curd & Paneer', items: [{ id: '1', productKey: 'd1' },  { id: '2', productKey: 'd4' }] },
  { id: '6', title: 'Chocolates & Sweets', items: [{ id: '1', productKey: 's4' },  { id: '2', productKey: 's8' }] },
];

// ─── Category Products ──────────────────────────────────────────────────────
const WINTER_PRODUCTS = [
  { _id:'wi1',  productKey:'wi1',  name:'Woolen Sweater',         price:899,  unit:'1 pc',  badge:'Warm',     imageUrl:'https://picsum.photos/seed/wool-sweater/300/300' },
  { _id:'wi2',  productKey:'wi2',  name:'Puffer Jacket',          price:2499, unit:'1 pc',  badge:'Premium',  imageUrl:'https://picsum.photos/seed/puffer-jacket/300/300' },
  { _id:'wi3',  productKey:'wi3',  name:'Fleece Blanket',         price:799,  unit:'1 pc',  badge:'Cozy',     imageUrl:'https://picsum.photos/seed/fleece-blanket/300/300' },
  { _id:'wi4',  productKey:'wi4',  name:'Room Heater',            price:1899, unit:'1 pc',  badge:'Essential', imageUrl:'https://picsum.photos/seed/room-heater/300/300' },
  { _id:'wi5',  productKey:'wi5',  name:'Thermal Socks (3 pair)', price:399,  unit:'3 pcs', badge:'Popular',  imageUrl:'https://picsum.photos/seed/thermal-socks/300/300' },
  { _id:'wi6',  productKey:'wi6',  name:'Beanie Cap',             price:249,  unit:'1 pc',  badge:null,       imageUrl:'https://picsum.photos/seed/beanie-cap/300/300' },
  { _id:'wi7',  productKey:'wi7',  name:'Hand Gloves',            price:349,  unit:'1 pair',badge:'Warm',     imageUrl:'https://picsum.photos/seed/wool-gloves/300/300' },
  { _id:'wi8',  productKey:'wi8',  name:'Hot Water Bottle',       price:299,  unit:'1 pc',  badge:null,       imageUrl:'https://picsum.photos/seed/hot-water-bottle/300/300' },
  { _id:'wi9',  productKey:'wi9',  name:'Electric Kettle',        price:999,  unit:'1 pc',  badge:'Popular',  imageUrl:'https://picsum.photos/seed/electric-kettle/300/300' },
  { _id:'wi10', productKey:'wi10', name:'Hoodie Sweatshirt',      price:1299, unit:'1 pc',  badge:'Trending', imageUrl:'https://picsum.photos/seed/hoodie-sweatshirt/300/300' },
  { _id:'wi11', productKey:'wi11', name:'Muffler Scarf',          price:499,  unit:'1 pc',  badge:null,       imageUrl:'https://picsum.photos/seed/muffler-scarf/300/300' },
  { _id:'wi12', productKey:'wi12', name:'Quilt Double Bed',       price:1999, unit:'1 pc',  badge:'Premium',  imageUrl:'https://picsum.photos/seed/quilt-blanket/300/300' },
];

const ELECTRONICS_PRODUCTS = [
  { _id:'el1',  productKey:'el1',  name:'boAt Rockerz 450',       price:1499, unit:'1 pc',  badge:'Bestseller', imageUrl:'https://picsum.photos/seed/headphones-black/300/300' },
  { _id:'el2',  productKey:'el2',  name:'boAt Airdopes 141',      price:1299, unit:'1 pc',  badge:'Popular',    imageUrl:'https://picsum.photos/seed/wireless-earbuds/300/300' },
  { _id:'el3',  productKey:'el3',  name:'JBL Flip 5 Speaker',     price:8999, unit:'1 pc',  badge:'Premium',    imageUrl:'https://picsum.photos/seed/bluetooth-speaker/300/300' },
  { _id:'el4',  productKey:'el4',  name:'Anker 20W Charger',      price:1099, unit:'1 pc',  badge:null,         imageUrl:'https://picsum.photos/seed/phone-charger/300/300' },
  { _id:'el5',  productKey:'el5',  name:'USB-C Cable 1m',         price:299,  unit:'1 pc',  badge:null,         imageUrl:'https://picsum.photos/seed/usb-cable/300/300' },
  { _id:'el6',  productKey:'el6',  name:'Mi Power Bank 10000mAh', price:1099, unit:'1 pc',  badge:'Popular',    imageUrl:'https://picsum.photos/seed/power-bank/300/300' },
  { _id:'el7',  productKey:'el7',  name:'Fire-Boltt Smartwatch',  price:1799, unit:'1 pc',  badge:'Trending',   imageUrl:'https://picsum.photos/seed/smartwatch/300/300' },
  { _id:'el8',  productKey:'el8',  name:'Noise ColorFit Pro 5',   price:2499, unit:'1 pc',  badge:'New',        imageUrl:'https://picsum.photos/seed/fitness-watch/300/300' },
  { _id:'el9',  productKey:'el9',  name:'Ambrane Wireless Mouse',  price:499,  unit:'1 pc',  badge:null,         imageUrl:'https://picsum.photos/seed/wireless-mouse/300/300' },
  { _id:'el10', productKey:'el10', name:'Portronics SoundDrum',    price:1299, unit:'1 pc',  badge:'Popular',    imageUrl:'https://picsum.photos/seed/portable-speaker/300/300' },
  { _id:'el11', productKey:'el11', name:'Zebronics LED Desk Lamp', price:799,  unit:'1 pc',  badge:null,         imageUrl:'https://picsum.photos/seed/desk-lamp/300/300' },
  { _id:'el12', productKey:'el12', name:'Realme Buds Air 5',       price:2999, unit:'1 pc',  badge:'Premium',    imageUrl:'https://picsum.photos/seed/earbuds-white/300/300' },
];

const BEAUTY_PRODUCTS = [
  { _id:'be1',  productKey:'be1',  name:'Lakme Foundation',       price:499,  unit:'25ml',  badge:'Bestseller', imageUrl:'https://picsum.photos/seed/makeup-foundation/300/300' },
  { _id:'be2',  productKey:'be2',  name:'Maybelline Lipstick',    price:349,  unit:'1 pc',  badge:'Popular',    imageUrl:'https://picsum.photos/seed/red-lipstick/300/300' },
  { _id:'be3',  productKey:'be3',  name:'Cetaphil Face Wash',     price:399,  unit:'125ml', badge:'Gentle',     imageUrl:'https://picsum.photos/seed/face-wash/300/300' },
  { _id:'be4',  productKey:'be4',  name:'Neutrogena Sunscreen',   price:599,  unit:'50ml',  badge:'SPF 50',     imageUrl:'https://picsum.photos/seed/sunscreen-tube/300/300' },
  { _id:'be5',  productKey:'be5',  name:'Nykaa Nail Polish',      price:199,  unit:'1 pc',  badge:'Trending',   imageUrl:'https://picsum.photos/seed/nail-polish/300/300' },
  { _id:'be6',  productKey:'be6',  name:'LOreal Shampoo',         price:399,  unit:'340ml', badge:'Popular',    imageUrl:'https://picsum.photos/seed/shampoo-bottle/300/300' },
  { _id:'be7',  productKey:'be7',  name:'Dove Conditioner',       price:299,  unit:'180ml', badge:null,         imageUrl:'https://picsum.photos/seed/hair-conditioner/300/300' },
  { _id:'be8',  productKey:'be8',  name:'Nivea Body Lotion',      price:249,  unit:'200ml', badge:'Hydrating',  imageUrl:'https://picsum.photos/seed/body-lotion/300/300' },
  { _id:'be9',  productKey:'be9',  name:'Wild Stone Perfume',     price:399,  unit:'100ml', badge:'Popular',    imageUrl:'https://picsum.photos/seed/mens-perfume/300/300' },
  { _id:'be10', productKey:'be10', name:'MAC Compact Powder',     price:1999, unit:'1 pc',  badge:'Premium',    imageUrl:'https://picsum.photos/seed/compact-powder/300/300' },
  { _id:'be11', productKey:'be11', name:'Himalaya Face Pack',     price:149,  unit:'100ml', badge:'Natural',    imageUrl:'https://picsum.photos/seed/face-pack/300/300' },
  { _id:'be12', productKey:'be12', name:'Biotique Hair Oil',      price:199,  unit:'200ml', badge:null,         imageUrl:'https://picsum.photos/seed/hair-oil/300/300' },
];

const DECOR_PRODUCTS = [
  { _id:'de1',  productKey:'de1',  name:'Wall Art Canvas',        price:799,  unit:'1 pc',  badge:'Trending',   imageUrl:'https://picsum.photos/seed/wall-art/300/300' },
  { _id:'de2',  productKey:'de2',  name:'LED Fairy Lights',       price:299,  unit:'10m',   badge:'Popular',    imageUrl:'https://picsum.photos/seed/fairy-lights/300/300' },
  { _id:'de3',  productKey:'de3',  name:'Indoor Plant (Money)',   price:349,  unit:'1 pot', badge:'Fresh',      imageUrl:'https://picsum.photos/seed/indoor-plant/300/300' },
  { _id:'de4',  productKey:'de4',  name:'Ceramic Vase',           price:599,  unit:'1 pc',  badge:'Elegant',    imageUrl:'https://picsum.photos/seed/ceramic-vase/300/300' },
  { _id:'de5',  productKey:'de5',  name:'Scented Candle Set',     price:449,  unit:'3 pcs', badge:'Cozy',       imageUrl:'https://picsum.photos/seed/scented-candles/300/300' },
  { _id:'de6',  productKey:'de6',  name:'Velvet Cushion Cover',   price:399,  unit:'2 pcs', badge:'Soft',       imageUrl:'https://picsum.photos/seed/velvet-cushion/300/300' },
  { _id:'de7',  productKey:'de7',  name:'Bedside Table Lamp',     price:899,  unit:'1 pc',  badge:'New',        imageUrl:'https://picsum.photos/seed/bedside-lamp/300/300' },
  { _id:'de8',  productKey:'de8',  name:'Macrame Wall Hanging',   price:649,  unit:'1 pc',  badge:'Handmade',   imageUrl:'https://picsum.photos/seed/macrame-hanging/300/300' },
  { _id:'de9',  productKey:'de9',  name:'Photo Frame Set',        price:499,  unit:'5 pcs', badge:'Popular',    imageUrl:'https://picsum.photos/seed/photo-frames/300/300' },
  { _id:'de10', productKey:'de10', name:'Bamboo Shelf Rack',      price:1299, unit:'1 pc',  badge:null,         imageUrl:'https://picsum.photos/seed/bamboo-shelf/300/300' },
  { _id:'de11', productKey:'de11', name:'Dreamcatcher',           price:349,  unit:'1 pc',  badge:'Boho',       imageUrl:'https://picsum.photos/seed/dreamcatcher/300/300' },
  { _id:'de12', productKey:'de12', name:'Artificial Flower Bunch',price:249,  unit:'1 bunch',badge:null,        imageUrl:'https://picsum.photos/seed/artificial-flowers/300/300' },
];

const KIDS_PRODUCTS = [
  { _id:'k1',  productKey:'bc7', name:'Pampers Diapers',     price:699,  unit:'40 pcs', badge:'Trusted' },
  { _id:'k2',  productKey:'bc6', name:'Johnson Baby Wipes',  price:199,  unit:'80 pcs', badge:'Gentle' },
  { _id:'k3',  productKey:'s11', name:'Kinder Joy',          price:40,   unit:'1 pc',   badge:'Kids Fav' },
  { _id:'k4',  productKey:'b15', name:'Oreo',                price:20,   unit:'120g',   badge:'Popular' },
  { _id:'k5',  productKey:'s1',  name:'Cornetto Choco',      price:50,   unit:'1 pc',   badge:'Treat' },
  { _id:'k6',  productKey:'bc5', name:'Johnson Baby Powder', price:149,  unit:'200g',   badge:null },
  { _id:'k7',  productKey:'bc4', name:'Johnson Baby Oil',    price:179,  unit:'200ml',  badge:null },
  { _id:'k8',  productKey:'bc1', name:'Baby Rub',            price:199,  unit:'50g',    badge:'Soothing' },
  { _id:'k9',  productKey:'c9',  name:'Mango Juice',         price:30,   unit:'200ml',  badge:null },
  { _id:'k10', productKey:'f1',  name:'Banana',              price:45,   unit:'6 pcs',  badge:'Healthy' },
  { _id:'k11', productKey:'b8',  name:'Milk Bikis',          price:10,   unit:'56g',    badge:null },
  { _id:'k12', productKey:'ki1', name:'Building Blocks Set', price:599,  unit:'1 set',  badge:'Fun',      imageUrl:'https://picsum.photos/seed/building-blocks/300/300' },
  { _id:'k13', productKey:'ki2', name:'Coloring Book',       price:149,  unit:'1 pc',   badge:null,       imageUrl:'https://picsum.photos/seed/coloring-kit/300/300' },
  { _id:'k14', productKey:'ki3', name:'Baby Cerelac',        price:299,  unit:'300g',   badge:'Nutrition',imageUrl:'https://picsum.photos/seed/baby-cereal/300/300' },
];

const CATEGORY_PRODUCTS = {
  Winter:      WINTER_PRODUCTS,
  Electronics: ELECTRONICS_PRODUCTS,
  Beauty:      BEAUTY_PRODUCTS,
  Decor:       DECOR_PRODUCTS,
  Kids:        KIDS_PRODUCTS,
};

// All tab: mix of products from every category for a rich, long feed
const ALL_PRODUCTS_SECTIONS = [
  {
    title: 'Trending now', subtitle: 'Most popular picks',
    products: [
      { _id:'t1', productKey:'v1',  name:'Tomato',            price:30,  unit:'500g',  badge:'Fresh' },
      { _id:'t2', productKey:'f1',  name:'Banana',            price:45,  unit:'6 pcs', badge:'Popular' },
      { _id:'t3', productKey:'d1',  name:'Amul Gold Milk',    price:31,  unit:'500ml', badge:'Popular' },
      { _id:'t4', productKey:'m5',  name:'Pringles Original', price:199, unit:'107g',  badge:'Premium' },
      { _id:'t5', productKey:'c1',  name:'Coca Cola',         price:45,  unit:'750ml', badge:'Popular' },
      { _id:'t6', productKey:'s4',  name:'Ferrero Rocher',    price:199, unit:'16 pcs',badge:'Premium' },
      { _id:'t7', productKey:'b15', name:'Oreo',              price:20,  unit:'120g',  badge:'Popular' },
      { _id:'t8', productKey:'n8',  name:'Yippee Noodles',    price:14,  unit:'70g',   badge:null },
    ],
  },
  {
    title: 'Best sellers', subtitle: 'Loved by everyone',
    products: [
      { _id:'bs1', productKey:'d7',  name:'White Eggs',        price:89,  unit:'12 pcs',badge:null },
      { _id:'bs2', productKey:'m6',  name:'Doritos Nacho',     price:50,  unit:'40g',   badge:'Popular' },
      { _id:'bs3', productKey:'sc10',name:'Heinz Ketchup',     price:149, unit:'450ml', badge:'Popular' },
      { _id:'bs4', productKey:'ar1', name:'Aashirvaad Atta',   price:280, unit:'5kg',   badge:'Popular' },
      { _id:'bs5', productKey:'d9',  name:'Bread',             price:35,  unit:'400g',  badge:null },
      { _id:'bs6', productKey:'v6',  name:'Onion',             price:25,  unit:'500g',  badge:null },
    ],
  },
  {
    title: 'Winter collection', subtitle: 'Stay warm this season',
    products: WINTER_PRODUCTS.slice(0, 6),
  },
  {
    title: 'Electronics & Gadgets', subtitle: 'Top picks in tech',
    products: ELECTRONICS_PRODUCTS.slice(0, 6),
  },
  {
    title: 'Beauty & Skincare', subtitle: 'Glow up essentials',
    products: BEAUTY_PRODUCTS.slice(0, 6),
  },
  {
    title: 'Home Decor', subtitle: 'Make your space beautiful',
    products: DECOR_PRODUCTS.slice(0, 6),
  },
  {
    title: 'Kids corner', subtitle: 'Treats & care for little ones',
    products: KIDS_PRODUCTS.slice(0, 6),
  },
  {
    title: 'Dairy, Eggs & Bread', subtitle: 'Fresh daily essentials',
    products: [
      { _id:'da1', productKey:'d1',  name:'Amul Gold Milk',    price:31,  unit:'500ml', badge:'Popular' },
      { _id:'da2', productKey:'d2',  name:'Almond Milk',       price:149, unit:'1L',    badge:'Premium' },
      { _id:'da3', productKey:'d4',  name:'Dahi',              price:42,  unit:'400g',  badge:'Fresh' },
      { _id:'da4', productKey:'d7',  name:'White Eggs',        price:89,  unit:'12 pcs',badge:null },
      { _id:'da5', productKey:'d9',  name:'Bread',             price:35,  unit:'400g',  badge:null },
      { _id:'da6', productKey:'d10', name:'Whole Wheat Bread', price:45,  unit:'400g',  badge:'Healthy' },
    ],
  },
  {
    title: 'Munchies', subtitle: 'Crunchy snacks for any mood',
    products: [
      { _id:'mu1', productKey:'m1',  name:"Lay's Sweet Spicy",    price:20,  unit:'26g',  badge:'Popular' },
      { _id:'mu2', productKey:'m5',  name:'Pringles Original',    price:199, unit:'107g', badge:'Premium' },
      { _id:'mu3', productKey:'m6',  name:'Doritos Nacho',        price:50,  unit:'40g',  badge:'Popular' },
      { _id:'mu4', productKey:'m10', name:'Takis Fuego',          price:150, unit:'56g',  badge:'Spicy' },
      { _id:'mu5', productKey:'m7',  name:'Pringles Cream Onion', price:199, unit:'107g', badge:null },
      { _id:'mu6', productKey:'m11', name:'Pringles BBQ',         price:199, unit:'107g', badge:'Premium' },
    ],
  },
  {
    title: 'Korean Ramen', subtitle: 'Trending flavours from Korea',
    products: [
      { _id:'kr1', productKey:'n1', name:'Buldak Black',  price:180, unit:'1 pc', badge:'Spicy' },
      { _id:'kr2', productKey:'n2', name:'Buldak Pink',   price:180, unit:'1 pc', badge:'Trending' },
      { _id:'kr3', productKey:'n3', name:'Buldak Yellow', price:180, unit:'1 pc', badge:'Cheese' },
      { _id:'kr4', productKey:'n4', name:'Maggi Cuppa',   price:30,  unit:'70g',  badge:'Popular' },
    ],
  },
  {
    title: 'Chocolates & Sweets', subtitle: 'Indulge your sweet tooth',
    products: [
      { _id:'ch1', productKey:'s4',  name:'Ferrero Rocher', price:199, unit:'16 pcs',badge:'Premium' },
      { _id:'ch2', productKey:'s9',  name:'Toblerone',      price:180, unit:'100g',  badge:'Imported' },
      { _id:'ch3', productKey:'s8',  name:'Snickers Minis', price:99,  unit:'162g',  badge:'Popular' },
      { _id:'ch4', productKey:'s11', name:'Kinder Joy',     price:40,  unit:'1 pc',  badge:'Kids Fav' },
      { _id:'ch5', productKey:'s1',  name:'Cornetto Choco', price:50,  unit:'1 pc',  badge:null },
      { _id:'ch6', productKey:'s13', name:'Bounty',         price:60,  unit:'57g',   badge:'Coconut' },
    ],
  },
  {
    title: 'Cold Drinks', subtitle: 'Chilled & refreshing',
    products: [
      { _id:'cd1', productKey:'c1',  name:'Coca Cola',    price:45, unit:'750ml', badge:'Popular' },
      { _id:'cd2', productKey:'c2',  name:'Pepsi',        price:45, unit:'750ml', badge:null },
      { _id:'cd3', productKey:'c3',  name:'Sprite',       price:45, unit:'750ml', badge:null },
      { _id:'cd4', productKey:'c9',  name:'Mango Juice',  price:30, unit:'200ml', badge:null },
      { _id:'cd5', productKey:'c13', name:'Tropicana',    price:99, unit:'1L',    badge:'Premium' },
      { _id:'cd6', productKey:'c10', name:'Moggu Moggu',  price:60, unit:'320ml', badge:'Trending' },
    ],
  },
  {
    title: 'Baby Care', subtitle: 'Gentle care for your little one',
    products: [
      { _id:'bca1', productKey:'bc7', name:'Pampers Diapers',     price:699, unit:'40 pcs',badge:'Trusted' },
      { _id:'bca2', productKey:'bc5', name:'Johnson Baby Powder', price:149, unit:'200g',  badge:null },
      { _id:'bca3', productKey:'bc4', name:'Johnson Baby Oil',    price:179, unit:'200ml', badge:'Gentle' },
      { _id:'bca4', productKey:'bc6', name:'Johnson Baby Wipes',  price:199, unit:'80 pcs',badge:null },
      { _id:'bca5', productKey:'bc1', name:'Baby Rub',            price:199, unit:'50g',   badge:'Soothing' },
      { _id:'bca6', productKey:'bc3', name:'Johnson Baby Cream',  price:129, unit:'200g',  badge:'Popular' },
    ],
  },
];

const CATEGORY_SECTION_TITLES = {
  Winter:      { first: 'Snuggle, sip & stay warm',   firstSub: 'Top winter picks',           second: 'More winter essentials', secondSub: 'Beat the cold' },
  Electronics: { first: 'Top Gadgets & Audio',         firstSub: 'Latest tech arrivals',        second: 'Charging & Accessories', secondSub: 'Power up your devices' },
  Beauty:      { first: 'Beauty Bestsellers',          firstSub: 'Most loved skincare & makeup',second: 'Hair & Body Care',       secondSub: 'Complete your routine' },
  Decor:       { first: 'Home Decor Must-Haves',       firstSub: 'Transform your space',        second: 'Lights & Accents',       secondSub: 'Add warmth to every room' },
  Kids:        { first: 'Baby Care Essentials',         firstSub: 'Trusted by parents',          second: 'Snacks & Toys',          secondSub: 'Fun for the little ones' },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const HomeScreen = ({ onTabSwitch }) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { cartCount } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const { addressDisplayText, addressSubText, nearestStore, selectAddress } = useAddress();
  const [homeSections, setHomeSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const snowAnims = useRef(
    Array.from({ length: SNOW_ANIMS_COUNT }, () => new Animated.Value(0))
  ).current;
  const snowCancelledRef = useRef(false);
  const isSnowRunningRef = useRef(false);
  const lottieRef = useRef(null);
  const kidsLottieRef = useRef(null);

  // ── Snow loop ──────────────────────────────────────────────────────────────
  const runSnowLoop = useCallback((anim, duration) => {
    if (snowCancelledRef.current) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished && !snowCancelledRef.current) runSnowLoop(anim, duration);
      }
    );
  }, []);

  const startSnowAnimations = useCallback(() => {
    if (isSnowRunningRef.current) return;
    isSnowRunningRef.current = true;
    snowCancelledRef.current = false;
    [3000, 3500, 4000, 3200, 3800, 2800].forEach((d, i) => {
      if (!snowCancelledRef.current) runSnowLoop(snowAnims[i], d);
    });
  }, [runSnowLoop, snowAnims]);

  useEffect(() => {
    if (selectedCategory !== 'Winter') {
      isSnowRunningRef.current = false;
      snowCancelledRef.current = true;
      lottieRef.current?.pause();
    }
    const t = setTimeout(() => {
      if (selectedCategory === 'Winter') { lottieRef.current?.play(); startSnowAnimations(); }
      if (selectedCategory === 'Kids' && !isSearchFocused) kidsLottieRef.current?.play();
      else kidsLottieRef.current?.pause();
    }, 100);
    return () => clearTimeout(t);
  }, [selectedCategory, isSearchFocused, startSnowAnimations]);

  useEffect(() => () => { snowCancelledRef.current = true; snowAnims.forEach(a => a.stopAnimation()); }, [snowAnims]);

  // ── Fetch dynamic home sections from API ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/home-sections`);
        const data = await res.json();
        if (data.success) {
          setHomeSections(
            data.data.map((sec) => ({
              _id: sec._id,
              title: sec.title,
              subtitle: sec.subtitle,
              products: (sec.products || []).map((p) => ({
                _id: p._id,
                productKey: p.productKey,
                name: p.name,
                price: p.price,
                discountPrice: p.discountPrice,
                discountPercentage: p.discountPercentage,
                unit: p.unit,
                badge: p.badge,
                description: p.description,
                imageUrl: p.images?.length
                  ? p.images.sort((a, b) => a.order - b.order)[0].url
                  : (p.imageUrl || ''),
                images: (p.images || []).sort((a, b) => a.order - b.order),
                stock: p.stock,
                isOutOfStock: p.isOutOfStock,
                brand: p.brand,
                category: p.category?.name || p.category || '',
                weight: p.weight,
              })),
            }))
          );
        }
      } catch (e) {
        console.error('Failed to fetch home sections:', e);
      } finally {
        setSectionsLoading(false);
      }
    })();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleProductPress = useCallback((item) => {
    const localImg = IMAGE_MAP[item.productKey];
    const serverImg = item.imageUrl ? { uri: resolveImageUrl(item.imageUrl) } : null;
    const resolvedImages = (item.images || []).map(img => ({
      ...img,
      uri: resolveImageUrl(img.url),
    }));
    navigation.navigate('ProductDetailScreen', {
      product: {
        ...item,
        id: item.productKey || item._id,
        image: localImg || serverImg,
        images: resolvedImages,
      },
      categoryName: item.category || 'Vegetables & Fruits',
      products: [],
    });
  }, [navigation]);

  const handleCategoryPress = useCallback((name) => {
    if (selectedCategory === name) return;
    isSnowRunningRef.current = false;
    snowCancelledRef.current = true;
    if (selectedCategory === 'Winter') {
      lottieRef.current?.pause();
      snowAnims.forEach(a => a.stopAnimation(() => {}));
    }
    setSelectedCategory(name);
    setIsSearchFocused(false);
  }, [selectedCategory, snowAnims]);

  const handleAddressSelect = (data) => {
    if (data.type === 'current') {
      selectAddress(null);
      navigation.navigate('MapSelection', { type: 'current' });
    } else if (data.type === 'new') {
      navigation.navigate('MapSelection');
    } else if (data.type === 'search') {
      navigation.navigate('MapSelection', { latitude: data.latitude, longitude: data.longitude });
    } else if (data.type === 'saved') {
      selectAddress(data.address);
    }
  };

  const handleBannerPress = useCallback((banner) => {
    // Navigate to category products screen for this banner's category
    const cat = banner.category;
    if (cat && cat !== 'All') {
      setSelectedCategory(cat);
    }
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const gradient       = CATEGORY_GRADIENTS[selectedCategory] ?? CATEGORY_GRADIENTS.All;
  const accent         = CATEGORY_ACCENT[selectedCategory] ?? CATEGORY_ACCENT.All;
  const currentBanners = FEATURED_BANNERS[selectedCategory] ?? FEATURED_BANNERS.All;
  const isWinter       = selectedCategory === 'Winter';
  const isKids         = selectedCategory === 'Kids';
  const isAll          = selectedCategory === 'All';
  const bannerW        = Math.min(width * 0.52, 220);
  const productW       = Math.min(width * 0.42, 165);
  const freqCardW      = (width - 48) / 2;

  // Category-specific data removed — now fully API-driven

  const SNOW_POSITIONS = ['8%', '22%', '38%', '55%', '72%', '88%'];
  const SNOW_SIZES     = [12, 16, 13, 11, 15, 12];

  const renderCategory = useCallback(({ item }) => {
    const active = selectedCategory === item.name;
    return (
      <TouchableOpacity style={s.catItem} onPress={() => handleCategoryPress(item.name)} activeOpacity={0.75}
        accessibilityRole="tab" accessibilityState={{ selected: active }}>
        <View style={[s.catIconWrap, active && s.catIconWrapActive]}>
          {renderIcon(item.icon, item.iconType, 22, active ? COLORS.ink : '#666')}
        </View>
        <Text style={[s.catLabel, active && s.catLabelActive]}>{item.name}</Text>
        {active && <View style={[s.catDot, { backgroundColor: accent }]} />}
      </TouchableOpacity>
    );
  }, [selectedCategory, handleCategoryPress, accent]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={gradient[0]} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={s.headerShell}>
        <LinearGradient colors={gradient} style={s.headerGradient}>
          {isWinter && (
            <View style={s.bearWrap} pointerEvents="none">
              <LottieView ref={lottieRef} source={require('../assets/BearWinter.json')} autoPlay={false} loop style={s.bearLottie} />
            </View>
          )}
          {isWinter && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {snowAnims.map((anim, i) => (
                <Animated.View key={i} style={[s.snowflake, { left: SNOW_POSITIONS[i] }, {
                  transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 380 + i * 10] }) }],
                  opacity: anim.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                }]}>
                  <Icon name="snow" size={SNOW_SIZES[i]} color="rgba(255,255,255,0.9)" />
                </Animated.View>
              ))}
            </View>
          )}

          <SafeAreaView edges={['top']} style={s.safeHeader}>
            <View style={s.topBar}>
              <View style={s.deliveryBlock}>
                <View style={s.deliveryTimeRow}>
                  <Text style={s.deliveryMins}>15 minutes</Text>
                  {nearestStore ? (
                  <View style={s.deliveryBadge}>
                    <Icon name="car-outline" size={11} color={accent} />
                    <Text style={[s.deliveryBadgeText, { color: accent }]}>
                      {nearestStore.distance < 1
                        ? `${Math.round(nearestStore.distance * 1000)}m`
                        : `${nearestStore.distance.toFixed(1)} km`} away
                    </Text>
                  </View>
                  ) : null}
                </View>
                <TouchableOpacity style={s.addressRow} onPress={() => setShowAddressModal(true)} activeOpacity={0.8}>
                  <Icon name="location-sharp" size={13} color="#555" />
                  <Text style={s.addressText} numberOfLines={1}>{addressDisplayText}{addressSubText ? ` — ${addressSubText}` : ''}</Text>
                  <Icon name="chevron-down" size={13} color="#555" />
                </TouchableOpacity>
              </View>
              <View style={s.topActions}>
                <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Cart')} activeOpacity={0.85}>
                  <Icon1 name="shopping-cart" size={19} color={COLORS.ink} />
                  {cartCount > 0 && <View style={s.cartBadge}><Text style={s.cartBadgeText}>{cartCount}</Text></View>}
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
                  <Icon name="person-outline" size={20} color={COLORS.ink} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.searchWrap}>
              {isKids && !isSearchFocused && (
                <View style={s.kidsLottieWrap} pointerEvents="none">
                  <LottieView ref={kidsLottieRef} source={require('../assets/kids.json')} autoPlay={false} loop style={s.kidsLottie} />
                </View>
              )}
              <View style={[s.searchBar, isSearchFocused && s.searchBarFocused]}>
                <Icon name="search-outline" size={20} color="#999" />
                <TextInput style={s.searchInput} placeholder={isKids && !isSearchFocused ? '' : 'Search products...'} placeholderTextColor="#AAA"
                  onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)} />
                <TouchableOpacity activeOpacity={0.7}><Icon name="mic-outline" size={20} color="#555" /></TouchableOpacity>
              </View>
            </View>

            <FlatList data={CATEGORIES} renderItem={renderCategory} keyExtractor={i => `cat-${i.id}`}
              horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catsContainer}
              removeClippedSubviews={false} initialNumToRender={6} />
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <ScrollView style={s.body} showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => { setIsSearchFocused(false); Keyboard.dismiss(); }}>

        {/* Winter strip */}
        {isWinter && (
          <View style={[s.winterStrip, { borderColor: gradient[1] }]}>
            <View style={[s.winterStripIcon, { backgroundColor: accent + '18' }]}>
              <Icon name="snow" size={24} color={accent} />
            </View>
            <View>
              <Text style={[s.winterStripLabel, { color: accent }]}>STOCK UP FOR THE</Text>
              <Text style={[s.winterStripTitle, { color: COLORS.ink }]}>Winter Season</Text>
            </View>
          </View>
        )}

        {/* Banners */}
        {currentBanners.length > 0 && (
          <View style={s.bannersSection}>
            <FlatList data={currentBanners} renderItem={({ item }) => <BannerCard item={item} width={bannerW} onPress={() => handleBannerPress(item)} />}
              keyExtractor={i => i.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bannersScroll} />
          </View>
        )}

        {/* ── Dynamic sections from API ── */}
        {isAll && homeSections.map((sec) => (
          <View key={sec._id} style={s.section}>
            <SectionHeader title={sec.title} subtitle={sec.subtitle} onSeeAll={() => onTabSwitch?.('Categories')} />
            <FlatList data={sec.products} renderItem={({ item }) => <ProductCard item={item} cardWidth={productW} onPress={handleProductPress} />}
              keyExtractor={i => i._id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.productScroll} />
          </View>
        ))}

        {/* Fallback: show hardcoded sections while API loads */}
        {isAll && sectionsLoading && ALL_PRODUCTS_SECTIONS.slice(0, 3).map((sec, idx) => (
          <View key={`fallback-${idx}`} style={s.section}>
            <SectionHeader title={sec.title} subtitle={sec.subtitle} />
            <FlatList data={sec.products} renderItem={({ item }) => <ProductCard item={item} cardWidth={productW} onPress={handleProductPress} />}
              keyExtractor={i => i._id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.productScroll} />
          </View>
        ))}

        {/* ── CATEGORY TABS: Navigate to category screen ── */}
        {!isAll && (
          <View style={s.section}>
            <TouchableOpacity
              style={s.categoryViewAll}
              onPress={() => onTabSwitch?.('Categories')}
              activeOpacity={0.8}
            >
              <Icon name="grid-outline" size={24} color={accent} />
              <Text style={[s.categoryViewAllText, { color: accent }]}>
                View all {selectedCategory} products
              </Text>
              <Icon name="arrow-forward" size={18} color={accent} />
            </TouchableOpacity>
          </View>
        )}

        {/* Frequently bought — All only */}
        {isAll && (
          <View style={s.section}>
            <SectionHeader title="Frequently bought" subtitle="Based on your past orders" onSeeAll={() => onTabSwitch?.('Categories')} />
            <View style={s.freqGrid}>
              {FREQUENTLY_BOUGHT.map((item, index) => {
                if (index % 2 !== 0) return null;
                const next = FREQUENTLY_BOUGHT[index + 1];
                return (
                  <View key={item.id} style={s.freqRow}>
                    <FreqCard item={item} cardWidth={freqCardW} onPress={() => onTabSwitch?.('Categories')} />
                    {next ? <FreqCard item={next} cardWidth={freqCardW} onPress={() => onTabSwitch?.('Categories')} /> : <View style={{ width: freqCardW }} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={s.promoWrap}><PromoStrip accent={accent} /></View>
        <View style={s.bottomPad} />
      </ScrollView>

      <AddressSelectionModal visible={showAddressModal} onClose={() => setShowAddressModal(false)} onAddressSelect={handleAddressSelect} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  headerShell: { zIndex: 10 },
  headerGradient: { position: 'relative' },
  safeHeader: {},
  bearWrap: { position: 'absolute', top: 28, right: 130, width: 110, height: 110, zIndex: 10 },
  bearLottie: { width: '100%', height: '100%' },
  snowflake: { position: 'absolute', top: -20, zIndex: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 4 },
  deliveryBlock: { flex: 1, marginRight: 12 },
  deliveryTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  deliveryMins: { fontSize: 24, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.5 },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.85)' },
  deliveryBadgeText: { fontSize: 11, fontWeight: '600' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 13, fontWeight: '600', color: COLORS.ink, flex: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -3, right: -3, width: 17, height: 17, borderRadius: 9, backgroundColor: COLORS.red, borderWidth: 1.5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  searchWrap: { marginHorizontal: 18, marginTop: 12, marginBottom: 2, position: 'relative' },
  kidsLottieWrap: { position: 'absolute', right: 90, top: -4, width: 220, height: 52, zIndex: 10 },
  kidsLottie: { width: '100%', height: '100%' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.95)' },
  searchBarFocused: { backgroundColor: '#FFFFFF', borderColor: '#DDDDD8' },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.ink, fontWeight: '400', padding: 0 },
  catsContainer: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18, gap: 2 },
  catItem: { alignItems: 'center', marginRight: 22, position: 'relative', paddingBottom: 8 },
  catIconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.92)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  catLabel: { fontSize: 11.5, fontWeight: '500', color: '#666', letterSpacing: 0.1 },
  catLabelActive: { fontWeight: '700', color: COLORS.ink },
  catDot: { position: 'absolute', bottom: 0, width: 5, height: 5, borderRadius: 3 },
  body: { flex: 1 },
  winterStrip: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 18, marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  winterStripIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  winterStripLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, marginBottom: 3 },
  winterStripTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  bannersSection: { marginTop: 10, marginLeft: -5 },
  bannersScroll: { paddingHorizontal: 10, gap: 0 },
  bannerCard: { borderRadius: 12, paddingHorizontal: 10, paddingBottom: 5, justifyContent: 'flex-end', height: 110, width: 120 },
  bannerBadge: { alignSelf: 'flex-start', marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.35)' },
  bannerBadgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.95)', letterSpacing: 0.3 },
  bannerTitle: { fontSize: 19, fontWeight: '700', color: '#FFFFFF', lineHeight: 23, letterSpacing: -0.3 },
  bannerSub: { fontSize: 10.5, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 3, fontWeight: '400' },
  section: { paddingHorizontal: 18, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 11 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12.5, color: COLORS.textSub, marginTop: 2, fontWeight: '400' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 12.5, fontWeight: '600', color: COLORS.textSub },
  productScroll: { gap: 12, paddingRight: 2 },
  productCard: { backgroundColor: COLORS.card, borderRadius: 18, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border },
  productImgWrap: { height: 115, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  productImg: { width: '70%', height: '80%' },
  productPlaceholder: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  productPlaceholderText: { fontSize: 28, fontWeight: '800' },
  productTag: { position: 'absolute', top: 9, left: 9, backgroundColor: '#EDF2FE', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  productTagText: { fontSize: 9.5, fontWeight: '700', color: '#4763C5' },
  productHeart: { position: 'absolute', top: 9, right: 9, width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 0.5, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  productInfo: { padding: 10 },
  productName: { fontSize: 12, fontWeight: '500', color: COLORS.ink, lineHeight: 16, height: 33, marginBottom: 6 },
  productPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginBottom: 8 },
  productPrice: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  productOrigPrice: { fontSize: 11, color: '#B0B0B0', textDecorationLine: 'line-through', fontWeight: '500' },
  productUnit: { fontSize: 11, color: COLORS.textMuted },
  addBtn: { height: 32, borderRadius: 9, borderWidth: 1.5, borderColor: COLORS.green, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  addBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.green, letterSpacing: 0.5 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 32, borderRadius: 9, backgroundColor: COLORS.green, overflow: 'hidden' },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', minWidth: 20, textAlign: 'center' },
  carouselDots: { position: 'absolute', bottom: 6, alignSelf: 'center', flexDirection: 'row', gap: 4, zIndex: 5 },
  carouselDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)' },
  carouselDotActive: { backgroundColor: 'rgba(0,0,0,0.5)', width: 7 },
  freqGrid: { gap: 8 },
  freqRow: { flexDirection: 'row', justifyContent: 'space-between' },
  freqCard: { backgroundColor: COLORS.card, borderRadius: 16, paddingHorizontal: 12, paddingTop: 11, paddingBottom: 10, borderWidth: 0.5, borderColor: COLORS.border, position: 'relative' },
  freqImgs: { flexDirection: 'row', gap: 5, marginBottom: 7, flexWrap: 'wrap' },
  freqImgBox: { width: 40, height: 40, borderRadius: 9, backgroundColor: COLORS.bg, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  freqImg: { width: '85%', height: '85%' },
  freqMore: { height: 40, borderRadius: 9, backgroundColor: '#F0F0EB', paddingHorizontal: 7, justifyContent: 'center', alignItems: 'center' },
  freqMoreText: { fontSize: 10, fontWeight: '700', color: '#888' },
  freqLabel: { fontSize: 12.5, fontWeight: '600', color: COLORS.ink, lineHeight: 17, paddingRight: 18 },
  freqArrow: { position: 'absolute', bottom: 10, right: 12 },
  promoWrap: { paddingHorizontal: 18, marginTop: 20 },
  promoStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFBF0', borderRadius: 18, padding: 14, borderWidth: 0.5, borderColor: '#F0E8C0' },
  promoIconWrap: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  promoText: { flex: 1 },
  promoTitle: { fontSize: 12.5, fontWeight: '600', color: '#4A3500', marginBottom: 2 },
  promoSub: { fontSize: 11.5, color: '#A08030', fontWeight: '400' },
  promoActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promoClose: { padding: 4 },
  categoryViewAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 20,
    marginHorizontal: 16, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  categoryViewAllText: { fontSize: 15, fontWeight: '700' },
  bottomPad: { height: 32 },
});

export default HomeScreen;
