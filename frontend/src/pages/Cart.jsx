import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ordersAPI } from '../services/api';
import { ShoppingCart, Trash2, Loader2, Package, ArrowRight, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

export default function Cart() {
  const { cartItems, cartTotal, loading, fetchCart, removeFromCart, clearCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [removing, setRemoving] = useState({});
  const [orderResult, setOrderResult] = useState(null);
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
      const response = await ordersAPI.checkout();
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
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className={`result-card ${isSuccess ? 'border-2 border-emerald-200' : 'border-2 border-red-200'}`}>
          <div className={`result-icon ${isSuccess ? 'result-icon-success' : 'result-icon-error'}`}>
            {isSuccess ? (
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          
          <h1 className={`result-title ${isSuccess ? 'result-title-success' : 'result-title-error'}`}>
            {isSuccess ? 'Order Confirmed!' : 'Payment Failed'}
          </h1>
          
          <p className="result-description">
            {isSuccess
              ? 'Your payment was successful and your order is being processed.'
              : 'Your payment was declined. Your cart items have been restored.'}
          </p>

          <div className="result-summary">
            <div className="summary-row">
              <span className="summary-label">Order ID</span>
              <span className="summary-value">#{orderResult.id}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Status</span>
              <span className={`badge ${isSuccess ? 'badge-confirmed' : 'badge-failed'}`}>
                {orderResult.status}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Total</span>
              <span className="summary-value font-bold text-indigo-600">
                ${parseFloat(orderResult.total_amount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="result-actions">
            <Link to="/orders" className="btn btn-primary">
              <Package className="h-4 w-4 mr-2" />
              View Orders
            </Link>
            <Link to="/products" className="btn btn-secondary">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <ShoppingCart className="empty-state-icon" />
        <h2 className="empty-state-title">Your cart is empty</h2>
        <p className="empty-state-description">Add some products to get started</p>
        <Link to="/products" className="btn btn-primary btn-inline">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Shopping Cart</h1>
          <p className="text-gray-600 mt-1">{cartItems.length} item(s) in your cart</p>
        </div>
        <button
          onClick={handleClearCart}
          className="btn btn-ghost btn-sm btn-inline text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={loading}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <Package className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="cart-item-details">
                <h3 className="cart-item-title">{item.product_name}</h3>
                <p className="cart-item-meta">
                  ${parseFloat(item.product_price).toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="cart-item-actions">
                <p className="font-semibold text-lg text-indigo-600">
                  ${parseFloat(item.subtotal).toFixed(2)}
                </p>
                <button
                  onClick={() => handleRemove(item.product_id)}
                  disabled={removing[item.product_id]}
                  className="text-red-500 hover:text-red-700 text-sm mt-1.5 flex items-center ml-auto transition-colors"
                >
                  {removing[item.product_id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="summary-card card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Order Summary</h2>
            
            <div className="space-y-1">
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">${parseFloat(cartTotal).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Shipping</span>
                <span className="summary-value text-emerald-600">Free</span>
              </div>
              <div className="summary-row summary-total">
                <span className="summary-label">Total</span>
                <span className="summary-value">${parseFloat(cartTotal).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut || loading}
              className="btn btn-primary w-full mt-6"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Checkout
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Payment simulation: 70% success rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
