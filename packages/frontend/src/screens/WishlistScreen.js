import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import IMAGE_MAP from '../utils/imageMap';
import { resolveImageUrl } from '../config/apiconfig';

const PLACEHOLDER_COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7',
  '#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9',
];

const getColor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length];
};

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

const WishlistItem = ({ item, onRemove, onAddToCart }) => {
  const [addedToCart, setAddedToCart] = useState(false);
  const [imgError, setImgError] = useState(false);
  const localImg = IMAGE_MAP[item.productKey];
  const hasUrl = !imgError && item.imageUrl;
  const imageSource = localImg || (hasUrl ? { uri: resolveImageUrl(item.imageUrl) } : null);
  const bg = getColor(item.name);

  return (
    <View style={styles.card}>
      <View style={[styles.imgWrap, { backgroundColor: imageSource ? '#F7F6F2' : bg + '20' }]}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.img}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: bg + '30' }]}>
            {item.icon ? (
              renderIcon(item.icon, item.iconType || 'Ionicons', 28, bg)
            ) : (
              <Text style={[styles.placeholderText, { color: bg }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.unit}>{item.unit}</Text>
        <Text style={styles.price}>Rs.{item.price}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cartBtn, addedToCart && styles.cartBtnActive]}
          onPress={() => {
            onAddToCart(item);
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 1200);
          }}
          activeOpacity={0.75}
        >
          <Text style={[styles.cartBtnText, addedToCart && styles.cartBtnTextActive]}>
            {addedToCart ? 'ADDED' : 'ADD'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(item.productKey || item._id)}
          activeOpacity={0.7}
        >
          <Icon name="heart-dislike-outline" size={18} color="#E53935" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const WishlistScreen = ({ navigation }) => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={styles.headerRight}>
          {wishlist.length > 0 && (
            <TouchableOpacity onPress={clearWishlist} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="heart-outline" size={48} color="#D0D0D0" />
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>
            Tap the heart icon on products to save them here
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.countLabel}>
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
          </Text>
          <FlatList
            data={wishlist}
            renderItem={({ item }) => (
              <WishlistItem
                item={item}
                onRemove={removeFromWishlist}
                onAddToCart={addItem}
              />
            )}
            keyExtractor={(item) => item.productKey || item._id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
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
  headerRight: {},
  clearBtn: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: { fontSize: 12, fontWeight: '700', color: '#E53935' },

  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AAB4',
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imgWrap: {
    width: 70,
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  img: { width: 55, height: 55 },
  placeholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 22, fontWeight: '800' },

  info: { flex: 1, gap: 2 },
  name: { fontSize: 13, fontWeight: '700', color: '#111', letterSpacing: -0.2, lineHeight: 17 },
  unit: { fontSize: 11, color: '#A0AAB4', fontWeight: '500' },
  price: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: -0.3, marginTop: 2 },

  actions: { alignItems: 'center', gap: 10, flexShrink: 0 },
  cartBtn: {
    borderWidth: 1.5,
    borderColor: '#2BB77D',
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  cartBtnActive: { backgroundColor: '#2BB77D' },
  cartBtnText: { fontSize: 11, fontWeight: '800', color: '#2BB77D', letterSpacing: 0.5 },
  cartBtnTextActive: { color: '#fff' },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#A0AAB4',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  shopBtn: {
    backgroundColor: '#2BB77D',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  shopBtnText: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});

export default WishlistScreen;
