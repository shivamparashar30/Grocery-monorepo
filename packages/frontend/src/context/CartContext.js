import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartService } from '../services/cartService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);

  const cartItemsRef = useRef([]);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  const buildFlatCart = (items) => {
    const flat = {};
    items.forEach((item) => {
      const pid = item.product?._id ?? item.product;
      flat[pid] = item.quantity;
    });
    return flat;
  };

  const applyCart = (backendCart) => {
    const items = backendCart?.items ?? [];
    setCartItems(items);
    cartItemsRef.current = items;
    setCart(buildFlatCart(items));
  };

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const backendCart = await cartService.getCart();
      applyCart(backendCart);
    } catch (err) {
      console.error('fetchCart error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, []);

  const addItem = useCallback(async (product) => {
    const productId = product._id ?? product.id;

    // Optimistic update
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
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
          _id: `temp_${productId}`,
          product: {
            _id: productId,
            name: product.name,
            productKey: product.productKey,
            unit: product.unit,
            category: product.category,
            price: product.price,
            ...product,
          },
          quantity: 1,
          price: product.price,
        },
      ];
    }); // ✅ setCartItems ends here — no early return, code continues below

    try {
      const existingItem = cartItemsRef.current.find(
        (i) => (i.product?._id ?? i.product) === productId
      );

      let backendCart;
      if (existingItem) {
        backendCart = await cartService.updateCartItem(
          existingItem._id,
          existingItem.quantity + 1
        );
      } else {
        backendCart = await cartService.addToCart(productId, 1);
      }

      // ✅ Merge backend response but PRESERVE productKey from optimistic state
      // in case your API doesn't populate it
      setCartItems((prev) => {
        const backendItems = backendCart?.items ?? [];
        return backendItems.map((backendItem) => {
          const bid = backendItem.product?._id ?? backendItem.product;
          const optimistic = prev.find(
            (o) => (o.product?._id ?? o.product) === bid
          );
          // If backend item is missing productKey, use the one from optimistic state
          if (
            optimistic?.product?.productKey &&
            !backendItem.product?.productKey
          ) {
            return {
              ...backendItem,
              product: {
                ...backendItem.product,
                productKey: optimistic.product.productKey,
              },
            };
          }
          return backendItem;
        });
      });
      setCart(buildFlatCart(backendCart?.items ?? []));

    } catch (err) {
      console.error('addItem error:', err.message);
      // Revert optimistic update
      setCart((prev) => {
        const updated = { ...prev };
        if (updated[productId] <= 1) delete updated[productId];
        else updated[productId] -= 1;
        return updated;
      });
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
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    const existingItem = cartItemsRef.current.find(
      (i) => (i.product?._id ?? i.product) === productId
    );
    if (!existingItem) return;

    setCart((prev) => {
      const updated = { ...prev };
      if (updated[productId] <= 1) delete updated[productId];
      else updated[productId] -= 1;
      return updated;
    });

    try {
      let backendCart;
      if (existingItem.quantity <= 1) {
        backendCart = await cartService.removeFromCart(existingItem._id);
      } else {
        backendCart = await cartService.updateCartItem(
          existingItem._id,
          existingItem.quantity - 1
        );
      }
      applyCart(backendCart);
    } catch (err) {
      console.error('removeItem error:', err.message);
      setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
    }
  }, []);

  const clearCart = useCallback(async () => {
    setCart({});
    setCartItems([]);
    cartItemsRef.current = [];
    try {
      await cartService.clearCart();
    } catch (err) {
      console.error('clearCart error:', err.message);
      fetchCart();
    }
  }, [fetchCart]);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

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