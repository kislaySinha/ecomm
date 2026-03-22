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
      <div className="empty-state animate-fade-in">
        <Package className="empty-state-icon" />
        <h2 className="empty-state-title">No orders yet</h2>
        <p className="empty-state-description">Your order history will appear here after you make a purchase</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <h1>Order History</h1>
        <p className="mt-2 text-gray-600">You have {orders.length} order(s)</p>
      </div>

      <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`order-status-icon ${config.bgColor}`}>
                      <StatusIcon className={`h-6 w-6 ${config.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                        <span className={`badge ${config.badge}`}>{order.status}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details (Expanded) */}
              {isExpanded && (
                <div className="order-details animate-fade-in">
                  <h4 className="font-medium text-gray-900 mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">
                              ${parseFloat(item.price).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {canCancel && (
                    <div className="mt-6 pt-5 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(order.id);
                        }}
                        disabled={cancelling[order.id]}
                        className="btn btn-danger btn-sm btn-inline"
                      >
                        {cancelling[order.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
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
