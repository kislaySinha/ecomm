import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { Package, Clock, CheckCircle, XCircle, Ban, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100', badge: 'badge-pending' },
  CONFIRMED: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100', badge: 'badge-confirmed' },
  FAILED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', badge: 'badge-failed' },
  CANCELLED: { icon: Ban, color: 'text-gray-500', bgColor: 'bg-gray-100', badge: 'badge-cancelled' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      const message = !error.response 
        ? 'Network error. Please check your connection.'
        : error.response?.data?.detail || error.response?.data?.message || 'Failed to load orders';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancelling((prev) => ({ ...prev, [orderId]: true }));
      await ordersAPI.cancel(orderId);
      toast.success('Order cancelled');
      await fetchOrders();
    } catch (error) {
      let message = 'Failed to cancel order';
      if (!error.response) {
        message = 'Network error. Please check your connection.';
      } else if (error.response.status === 400) {
        message = error.response?.data?.detail || 'Order cannot be cancelled';
      } else {
        message = error.response?.data?.detail || error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setCancelling((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <Loading message="Loading orders..." />;
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state fade-in">
        <Package className="empty-state-icon" />
        <h2 className="empty-state-title">No orders yet</h2>
        <p className="empty-state-description">Your order history will appear here after you make a purchase</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">You have {orders.length} order(s)</p>
      </div>

      <div>
        {orders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.PENDING;
          const StatusIcon = config.icon;
          const isExpanded = expandedOrder === order.id;
          const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

          return (
            <div key={order.id} className="order-card">
              {/* Order Header */}
              <div
                className="order-header"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div className="order-status-icon" style={{ 
                      backgroundColor: config.bgColor === 'bg-emerald-100' ? '#d1fae5' : 
                                       config.bgColor === 'bg-amber-100' ? '#fef3c7' :
                                       config.bgColor === 'bg-red-100' ? '#fee2e2' : '#f3f4f6'
                    }}>
                      <StatusIcon style={{ 
                        width: '24px', 
                        height: '24px',
                        color: config.color === 'text-emerald-600' ? '#059669' :
                               config.color === 'text-amber-600' ? '#d97706' :
                               config.color === 'text-red-600' ? '#dc2626' : '#6b7280'
                      }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <h3 style={{ fontWeight: '600', color: 'var(--color-text)' }}>Order #{order.id}</h3>
                        <span className={`badge ${config.badge}`}>{order.status}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--color-text)' }}>
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>
                    <div style={{ color: 'var(--color-text-light)' }}>
                      {isExpanded ? (
                        <ChevronUp style={{ width: '20px', height: '20px' }} />
                      ) : (
                        <ChevronDown style={{ width: '20px', height: '20px' }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details (Expanded) */}
              {isExpanded && (
                <div className="order-details fade-in">
                  <h4 style={{ fontWeight: '500', color: 'var(--color-text)', marginBottom: 'var(--spacing-md)' }}>
                    Order Items
                  </h4>
                  <div>
                    {order.items?.map((item) => (
                      <div key={item.id} className="order-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                          <div className="order-item-icon">
                            <Package style={{ width: '24px', height: '24px', color: 'white' }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: '500', color: 'var(--color-text)' }}>{item.product_name}</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                              ${parseFloat(item.price).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {canCancel && (
                    <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(order.id);
                        }}
                        disabled={cancelling[order.id]}
                        className="btn btn-danger btn-small"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {cancelling[order.id] ? (
                          <>
                            <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <Ban style={{ width: '16px', height: '16px' }} />
                            Cancel Order
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
