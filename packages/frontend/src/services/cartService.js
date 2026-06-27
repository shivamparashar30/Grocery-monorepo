import { BASE_URL } from '../config/apiconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_URL = `${BASE_URL}/cart`;

const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

export const cartService = {
    // GET /api/v1/cart
    getCart: async () => {
        const headers = await getAuthHeader();
        const res = await fetch(CART_URL, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch cart');
        return data.data;
    },

    // POST /api/v1/cart
    addToCart: async (productId, quantity = 1) => {
        const headers = await getAuthHeader();
        console.log('=== addToCart DEBUG ===');
        console.log('URL:', CART_URL);
        console.log('productId:', productId);
        console.log('headers:', JSON.stringify(headers));
        const res = await fetch(CART_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to add to cart');
        return data.data;
    },

    // PUT /api/v1/cart/:itemId
    updateCartItem: async (itemId, quantity) => {
        const headers = await getAuthHeader();
        const res = await fetch(`${CART_URL}/${itemId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ quantity }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update cart');
        return data.data;
    },

    // DELETE /api/v1/cart/:itemId
    removeFromCart: async (itemId) => {
        const headers = await getAuthHeader();
        const res = await fetch(`${CART_URL}/${itemId}`, {
            method: 'DELETE',
            headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to remove item');
        return data.data;
    },

    // DELETE /api/v1/cart
    clearCart: async () => {
        const headers = await getAuthHeader();
        const res = await fetch(CART_URL, {
            method: 'DELETE',
            headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to clear cart');
        return data.data;
    },
};