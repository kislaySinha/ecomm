import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setCartTotal('0.00');
      return;
    }

    try {
      setLoading(true);
      const response = await cartAPI.get();
      setCartItems(response.data.items || []);
      setCartTotal(response.data.total || '0.00');
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch cart when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      await cartAPI.add(productId, quantity);
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      await cartAPI.remove(productId);
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartAPI.clear();
      setCartItems([]);
      setCartTotal('0.00');
      return true;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        cartCount,
        loading,
        fetchCart,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
