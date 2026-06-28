import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import { navigationRef } from '../navigation/navigationRef';
import IMAGE_MAP from '../utils/imageMap';

const CART_HEIGHT = 72;
const BOTTOM_OFFSET = Platform.OS === 'ios' ? 96 : 76;
const HIDDEN_Y = CART_HEIGHT + BOTTOM_OFFSET + 40;

const HIDDEN_ROUTES = ['Cart', 'Checkout'];

const FloatingCart = ({ currentRoute }) => {
  const { cartItems, cartCount, cartTotal } = useCart();

  const shouldHide = HIDDEN_ROUTES.includes(currentRoute);
  const hasItems = cartCount > 0 && !shouldHide;

  const slideAnim = useRef(new Animated.Value(HIDDEN_Y)).current;
  const wasVisible = useRef(false);

  // Track whether we've ever shown (to avoid animating on mount)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (hasItems && !wasVisible.current) {
      // Slide up with spring overshoot
      wasVisible.current = true;
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }).start();
    } else if (!hasItems && wasVisible.current) {
      // Slide down smoothly
      wasVisible.current = false;
      Animated.spring(slideAnim, {
        toValue: HIDDEN_Y,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else if (hasItems && wasVisible.current) {
      // Already visible — ensure position is correct (e.g. navigating back)
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  }, [hasItems]);

  // Thumbnail data: latest 3 unique items
  const thumbnails = cartItems.slice(-3).map((item) => {
    const p = item.product || {};
    const key = p.productKey;
    const localImg = key ? IMAGE_MAP[key] : null;
    const remoteImg = p.imageUrl ? { uri: p.imageUrl } : null;
    return {
      id: p._id || item._id,
      name: p.name || '?',
      image: localImg || remoteImg,
    };
  });

  // Thumbnail enter animations
  const thumbAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const prevCountRef = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCountRef.current && thumbnails.length > 0) {
      const lastIdx = Math.min(thumbnails.length - 1, 2);
      thumbAnims[lastIdx].setValue(0);
      Animated.spring(thumbAnims[lastIdx], {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

  if (!mounted && !hasItems) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={hasItems ? 'auto' : 'none'}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.inner}
        onPress={() => navigationRef.current?.navigate('Cart')}
      >
        {/* Left: thumbnails */}
        <View style={styles.thumbRow}>
          {thumbnails.map((t, i) => (
            <Animated.View
              key={t.id}
              style={[
                styles.thumbWrap,
                i > 0 && { marginLeft: -8 },
                {
                  transform: [{ scale: thumbAnims[i] }],
                  opacity: thumbAnims[i],
                  zIndex: 10 + i,
                },
              ]}
            >
              {t.image ? (
                <Animated.Image
                  source={t.image}
                  style={styles.thumbImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
                  <Text style={styles.thumbInitial}>
                    {t.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </Animated.View>
          ))}
        </View>

        {/* Center: count + total */}
        <View style={styles.info}>
          <Text style={styles.countText}>
            {cartCount} item{cartCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.totalText} numberOfLines={1}>
            ₹{cartTotal.toFixed(0)}
          </Text>
        </View>

        {/* Right: View Cart button */}
        <View style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>View Cart</Text>
          <Icon name="arrow-forward" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: BOTTOM_OFFSET,
    zIndex: 999,
    elevation: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: CART_HEIGHT,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  thumbWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A1A2E',
    backgroundColor: '#2A2A3E',
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  thumbPlaceholder: {
    backgroundColor: '#3A3A5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  countText: {
    color: '#A0A0B8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2BB77D',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default FloatingCart;
