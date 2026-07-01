import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@grocery_cart';
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Debounced persistence ────────────────────────────────────────────────
  const persistTimer = useRef(null);
  const latestItems = useRef(cartItems);
  latestItems.current = cartItems;

  const schedulePersist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latestItems.current)).catch(() => {});
    }, 400);
  }, []);

  // ── Load on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) setCartItems(JSON.parse(json));
      } catch (e) {
        console.error('Cart load error:', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (persistTimer.current) clearTimeout(persistTimer.current); };
  }, []);

  // ── Derived (memoized) ──────────────────────────────────────────────────
  const cart = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      const pid = item.product?._id ?? item.product;
      map[pid] = item.quantity;
    });
    return map;
  }, [cartItems]);

  const cartCount = useMemo(() => cartItems.reduce((sum, i) => sum + i.quantity, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [cartItems]);

  // ── Add item ─────────────────────────────────────────────────────────────
  const addItem = useCallback((product) => {
    const productId = product._id ?? product.id;

    setCartItems((prev) => {
      const existing = prev.find((i) => (i.product?._id ?? i.product) === productId);
      if (existing) {
        return prev.map((i) =>
          (i.product?._id ?? i.product) === productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          _id: `local_${productId}_${Date.now()}`,
          product: {
            _id: productId,
            name: product.name,
            productKey: product.productKey,
            unit: product.unit,
            category: product.category,
            price: product.price,
            imageUrl: product.imageUrl,
          },
          quantity: 1,
          price: product.price,
        },
      ];
    });
    schedulePersist();
  }, [schedulePersist]);

  // ── Remove item (decrement or delete) ────────────────────────────────────
  const removeItem = useCallback((productId) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => (i.product?._id ?? i.product) === productId);
      if (!existing) return prev;

      if (existing.quantity <= 1) {
        return prev.filter((i) => (i.product?._id ?? i.product) !== productId);
      }
      return prev.map((i) =>
        (i.product?._id ?? i.product) === productId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );
    });
    schedulePersist();
  }, [schedulePersist]);

  // ── Clear cart ───────────────────────────────────────────────────────────
  const clearCart = useCallback(() => {
    setCartItems([]);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([])).catch(() => {});
  }, []);

  // ── Fetch cart (no-op, kept for API compatibility) ───────────────────────
  const fetchCart = useCallback(() => {}, []);

  const value = useMemo(() => ({
    cart,
    cartItems,
    loading,
    addItem,
    removeItem,
    clearCart,
    fetchCart,
    cartCount,
    cartTotal,
  }), [cart, cartItems, loading, addItem, removeItem, clearCart, fetchCart, cartCount, cartTotal]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
