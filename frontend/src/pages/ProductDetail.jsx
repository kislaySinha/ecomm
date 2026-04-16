import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, reviewAPI, cartAPI, wishlistAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Heart, Star, Package, Loader2, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

function StockDot({ quantity }) {
  if (quantity === 0) {
    return <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
      Out of Stock
    </span>;
  }
  if (quantity <= 5) {
    return <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
      Only {quantity} left
    </span>;
  }
  return <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
    In Stock
  </span>;
}

function StarRating({ rating }) {
  return (
    <span style={{ color: '#f59e0b' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadProduct();
    loadReviews();
    if (isAuthenticated) loadWishlistStatus();
  }, [id, isAuthenticated]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await productsAPI.getById(id);
      setProduct(res.data);
    } catch {
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await reviewAPI.getByProduct(id);
      setReviews(res.data.reviews || []);
      setReviewTotal(res.data.total || 0);
    } catch {
      // ignore
    }
  };

  const loadWishlistStatus = async () => {
    try {
      const res = await wishlistAPI.get();
      const inWishlist = res.data.some((item) => item.product_id === parseInt(id));
      setWishlisted(inWishlist);
    } catch {
      // ignore
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    try {
      setAddingToCart(true);
      await addToCart(parseInt(id), quantity);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    try {
      setWishlistLoading(true);
      if (wishlisted) {
        await wishlistAPI.remove(parseInt(id));
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(parseInt(id));
        setWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to review'); navigate('/login'); return; }
    try {
      setSubmittingReview(true);
      await reviewAPI.create(parseInt(id), newReview.rating, newReview.comment);
      toast.success('Review submitted!');
      setNewReview({ rating: 5, comment: '' });
      loadReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loading message="Loading product..." />;
  if (!product) return null;

  const stock = product.inventory?.quantity ?? 0;
  const isOutOfStock = stock === 0;
  const discounted = product.discount_percentage && parseFloat(product.discount_percentage) > 0;
  const discountedPrice = discounted
    ? parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)
    : null;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-2xl)' }}>
        {/* Product Image */}
        <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', position: 'relative' }}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
          ) : (
            <Package style={{ width: '80px', height: '80px', color: 'var(--color-text-light)' }} />
          )}
          {discounted && (
            <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '0.85rem' }}>
              -{product.discount_percentage}%
            </span>
          )}
          {product.is_new && (
            <span style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#10b981', color: 'white', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '0.85rem' }}>
              NEW
            </span>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.category && (
            <span style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
              {product.category}
            </span>
          )}
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 'var(--spacing-xs) 0 var(--spacing-sm)' }}>{product.name}</h1>

          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)' }}>
              <StarRating rating={Math.round(parseFloat(avgRating))} />
              <span style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>{avgRating} ({reviewTotal} reviews)</span>
            </div>
          )}

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {discounted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-accent)' }}>${discountedPrice.toFixed(2)}</span>
                <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: 'var(--color-text-light)' }}>${parseFloat(product.price).toFixed(2)}</span>
              </div>
            ) : (
              <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-accent)' }}>${parseFloat(product.price).toFixed(2)}</span>
            )}
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <StockDot quantity={stock} />
          </div>

          {product.description && (
            <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)', lineHeight: '1.6' }}>{product.description}</p>
          )}

          {!isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <span style={{ fontWeight: '500' }}>Qty:</span>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="btn-icon" disabled={quantity <= 1}>
                <Minus style={{ width: '16px', height: '16px' }} />
              </button>
              <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: '600' }}>{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(stock, q + 1))} className="btn-icon" disabled={quantity >= stock}>
                <Plus style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className={`btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {addingToCart ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <ShoppingCart style={{ width: '16px', height: '16px' }} />}
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Heart style={{ width: '16px', height: '16px', fill: wishlisted ? 'currentColor' : 'none' }} />
              {wishlisted ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
          Reviews {reviewTotal > 0 && `(${reviewTotal})`}
        </h2>

        {isAuthenticated && (
          <form onSubmit={handleSubmitReview} className="form-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Write a Review</h3>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <label style={{ fontWeight: '500', display: 'block', marginBottom: '4px' }}>Rating</label>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview(r => ({ ...r, rating: parseInt(e.target.value) }))}
                className="form-input"
                style={{ width: 'auto' }}
              >
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ fontWeight: '500', display: 'block', marginBottom: '4px' }}>Comment</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(r => ({ ...r, comment: e.target.value }))}
                className="form-input"
                rows={3}
                placeholder="Share your experience..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)' }}>No reviews yet. Be the first to review!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <StarRating rating={review.rating} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                    {review.reviewer_email?.replace(/(.{2}).*@/, '$1***@')} · {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && <p style={{ margin: 0, color: 'var(--color-text)' }}>{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
