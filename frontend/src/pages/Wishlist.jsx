import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI, cartAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart, Trash2, Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({});
  const [addingToCart, setAddingToCart] = useState({});
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistAPI.get();
      setItems(res.data || []);
    } catch {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      setRemoving((prev) => ({ ...prev, [productId]: true }));
      await wishlistAPI.remove(productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }));
      await addToCart(productId, 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) return <Loading message="Loading wishlist..." />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">My Wishlist</h1>
        <p className="page-subtitle">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Heart className="empty-state-icon" />
          <h2 className="empty-state-title">Your wishlist is empty</h2>
          <p className="empty-state-description">Save products you love to buy later</p>
          <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((item) => (
            <div key={item.id} className="product-card">
              <div className="product-image">
                {item.product_image_url ? (
                  <img src={item.product_image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package />
                )}
              </div>
              <div className="product-info">
                {item.product_category && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '600', textTransform: 'uppercase' }}>
                    {item.product_category}
                  </span>
                )}
                <h3 className="product-name">{item.product_name}</h3>
                <span className="product-price">${parseFloat(item.product_price || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', padding: '0 var(--spacing-md) var(--spacing-md)' }}>
                <button
                  onClick={() => handleAddToCart(item.product_id)}
                  disabled={addingToCart[item.product_id]}
                  className="btn btn-primary btn-full"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {addingToCart[item.product_id] ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <ShoppingCart style={{ width: '16px', height: '16px' }} />}
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(item.product_id)}
                  disabled={removing[item.product_id]}
                  className="btn btn-secondary btn-full"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-danger)' }}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
