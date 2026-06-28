import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@grocery_cart';
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Persist helpers ──────────────────────────────────────────────────────
  const persist = async (items) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Cart persist error:', e);
    }
  };

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
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const cart = {};
  cartItems.forEach((item) => {
    const pid = item.product?._id ?? item.product;
    cart[pid] = item.quantity;
  });

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Add item ─────────────────────────────────────────────────────────────
  const addItem = useCallback((product) => {
    const productId = product._id ?? product.id;

    setCartItems((prev) => {
      const existing = prev.find((i) => (i.product?._id ?? i.product) === productId);
      let next;
      if (existing) {
        next = prev.map((i) =>
          (i.product?._id ?? i.product) === productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        next = [
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
      }
      persist(next);
      return next;
    });
  }, []);

  // ── Remove item (decrement or delete) ────────────────────────────────────
  const removeItem = useCallback((productId) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => (i.product?._id ?? i.product) === productId);
      if (!existing) return prev;

      let next;
      if (existing.quantity <= 1) {
        next = prev.filter((i) => (i.product?._id ?? i.product) !== productId);
      } else {
        next = prev.map((i) =>
          (i.product?._id ?? i.product) === productId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      }
      persist(next);
      return next;
    });
  }, []);

  // ── Clear cart ───────────────────────────────────────────────────────────
  const clearCart = useCallback(() => {
    setCartItems([]);
    persist([]);
  }, []);

  // ── Fetch cart (no-op, kept for API compatibility) ───────────────────────
  const fetchCart = useCallback(() => {}, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        loading,
        addItem,
        removeItem,
        clearCart,
        fetchCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
