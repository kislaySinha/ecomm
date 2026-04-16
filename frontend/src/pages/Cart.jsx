import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ordersAPI, cartAPI } from '../services/api';
import { ShoppingCart, Trash2, Loader2, Package, ArrowRight, ShoppingBag, CheckCircle, XCircle, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

export default function Cart() {
  const { cartItems, cartTotal, loading, fetchCart, removeFromCart, clearCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [removing, setRemoving] = useState({});
  const [orderResult, setOrderResult] = useState(null);
  const [updatingQty, setUpdatingQty] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleRemove = async (productId) => {
    try {
      setRemoving((prev) => ({ ...prev, [productId]: true }));
      await removeFromCart(productId);
      toast.success('Item removed from cart');
    } catch (error) {
      const message = !error.response 
        ? 'Network error. Please check your connection.'
        : error.response?.data?.detail || error.response?.data?.message || 'Failed to remove item';
      toast.error(message);
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleQtyChange = async (productId, newQty) => {
    if (newQty <= 0) return handleRemove(productId);
    try {
      setUpdatingQty((prev) => ({ ...prev, [productId]: true }));
      await cartAPI.update(productId, newQty);
      await fetchCart();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update quantity');
    } finally {
      setUpdatingQty((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return;
    }
    try {
      await clearCart();
      toast.success('Cart cleared');
    } catch (error) {
      const message = !error.response 
        ? 'Network error. Please check your connection.'
        : error.response?.data?.detail || error.response?.data?.message || 'Failed to clear cart';
      toast.error(message);
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      const response = await ordersAPI.checkout({});
      const order = response.data;
      
      // Clear cart from state after successful checkout
      await clearCart();
      setOrderResult(order);

      if (order.status === 'CONFIRMED') {
        toast.success('Order placed successfully!');
      } else if (order.status === 'FAILED') {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      let message = 'Checkout failed';
      if (!error.response) {
        message = 'Network error. Please check your connection.';
      } else if (error.response.status === 400) {
        message = error.response?.data?.detail || 'Unable to process checkout';
      } else {
        message = error.response?.data?.detail || error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading && cartItems.length === 0) {
    return <Loading message="Loading cart..." />;
  }

  // Show order result if checkout completed
  if (orderResult) {
    const isSuccess = orderResult.status === 'CONFIRMED';
    return (
      <div className="cart-container fade-in">
        <div className="form-card" style={{ maxWidth: '500px', margin: '0 auto', border: isSuccess ? '2px solid #10b981' : '2px solid #ef4444' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
            {isSuccess ? (
              <CheckCircle style={{ width: '64px', height: '64px', color: '#10b981', margin: '0 auto var(--spacing-md)' }} />
            ) : (
              <XCircle style={{ width: '64px', height: '64px', color: '#ef4444', margin: '0 auto var(--spacing-md)' }} />
            )}
          </div>
          
          <h1 style={{ textAlign: 'center', color: isSuccess ? '#10b981' : '#ef4444' }}>
            {isSuccess ? 'Order Confirmed!' : 'Payment Failed'}
          </h1>
          
          <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
            {isSuccess
              ? 'Your payment was successful and your order is being processed.'
              : 'Your payment was declined. Your cart items have been restored.'}
          </p>

          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Order ID</span>
              <span>#{orderResult.id}</span>
            </div>
            <div className="cart-summary-row">
              <span>Status</span>
              <span style={{ 
                backgroundColor: isSuccess ? '#d1fae5' : '#fee2e2',
                color: isSuccess ? '#065f46' : '#991b1b',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {orderResult.status}
              </span>
            </div>
            <div className="cart-summary-row" style={{ borderBottom: 'none' }}>
              <span>Total</span>
              <span style={{ fontWeight: '700', color: 'var(--color-accent)', fontSize: '1.125rem' }}>
                ${parseFloat(orderResult.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <Link to="/orders" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Package style={{ width: '16px', height: '16px' }} />
              View Orders
            </Link>
            <Link to="/products" className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShoppingBag style={{ width: '16px', height: '16px' }} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="empty-state fade-in">
        <ShoppingCart className="empty-state-icon" />
        <h2 className="empty-state-title">Your cart is empty</h2>
        <p className="empty-state-description">Add some products to get started</p>
        <Link to="/products" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ShoppingBag style={{ width: '16px', height: '16px' }} />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container fade-in">
      <div className="flex-between mb-lg">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">{cartItems.length} item(s) in your cart</p>
        </div>
        <button
          onClick={handleClearCart}
          className="btn btn-secondary btn-small"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)' }}
        >
          <Trash2 style={{ width: '16px', height: '16px' }} />
          Clear Cart
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }}>
        {/* Cart Items */}
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <Package />
              </div>
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.product_name}</h3>
                <p className="cart-item-description" style={{ marginBottom: 'var(--spacing-xs)' }}>
                  ${parseFloat(item.product_price).toFixed(2)} each
                </p>
                {/* Qty +/- controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleQtyChange(item.product_id, item.quantity - 1)}
                    disabled={updatingQty[item.product_id] || removing[item.product_id]}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Minus style={{ width: '12px', height: '12px' }} />
                  </button>
                  <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '600', fontSize: '0.95rem' }}>
                    {updatingQty[item.product_id] ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : item.quantity}
                  </span>
                  <button
                    onClick={() => handleQtyChange(item.product_id, item.quantity + 1)}
                    disabled={updatingQty[item.product_id] || removing[item.product_id]}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="cart-item-price">
                  ${parseFloat(item.subtotal).toFixed(2)}
                </p>
                <button
                  onClick={() => handleRemove(item.product_id)}
                  disabled={removing[item.product_id]}
                  className="btn-icon"
                  style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {removing[item.product_id] ? (
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Order Summary</h2>
          
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>${parseFloat(cartTotal).toFixed(2)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Shipping</span>
            <span style={{ color: 'var(--color-success)' }}>Free</span>
          </div>
          <div className="cart-summary-total">
            <span>Total</span>
            <span>${parseFloat(cartTotal).toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut || loading}
            className="btn btn-primary btn-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {checkingOut ? (
              <>
                <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                Checkout
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </>
            )}
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
            Payment simulation: 70% success rate
          </p>
        </div>
      </div>
    </div>
  );
}
