import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_KEY = '@grocery_wishlist';
const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(WISHLIST_KEY);
        if (stored) setWishlist(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load wishlist:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)).catch(e =>
      console.error('Failed to save wishlist:', e)
    );
  }, [wishlist, loaded]);

  const addToWishlist = useCallback((product) => {
    setWishlist(prev => {
      const key = product.productKey || product._id;
      if (prev.some(p => (p.productKey || p._id) === key)) return prev;
      return [...prev, {
        _id: product._id,
        productKey: product.productKey,
        name: product.name,
        price: product.price,
        unit: product.unit,
        badge: product.badge || null,
        imageUrl: product.imageUrl || null,
        icon: product.icon || null,
        iconType: product.iconType || null,
      }];
    });
  }, []);

  const removeFromWishlist = useCallback((productKey) => {
    setWishlist(prev => prev.filter(p => (p.productKey || p._id) !== productKey));
  }, []);

  const isInWishlist = useCallback((productKey) => {
    return wishlist.some(p => (p.productKey || p._id) === productKey);
  }, [wishlist]);

  const toggleWishlist = useCallback((product) => {
    const key = product.productKey || product._id;
    if (wishlist.some(p => (p.productKey || p._id) === key)) {
      removeFromWishlist(key);
    } else {
      addToWishlist(product);
    }
  }, [wishlist, removeFromWishlist, addToWishlist]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  return (
    <WishlistContext.Provider value={{
      wishlist,
      wishlistCount: wishlist.length,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
