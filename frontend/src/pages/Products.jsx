import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productsAPI, wishlistAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Package, Loader2, AlertCircle, Plus, Heart, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

function StockDot({ quantity }) {
  if (quantity === 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.8rem' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
      Out of Stock
    </span>
  );
  if (quantity <= 5) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.8rem' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
      Only {quantity} left
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', flexShrink: 0 }} />
      In Stock
    </span>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState({});
  const { addToCart, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Search & filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      loadWishlist();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchProducts(1);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [search, category, inStock, sortBy]);

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const loadWishlist = async () => {
    try {
      const res = await wishlistAPI.get();
      setWishlistIds(new Set((res.data || []).map((i) => i.product_id)));
    } catch {
      // ignore
    }
  };

  const fetchProducts = async (pg = page) => {
    try {
      setLoading(true);
      const params = { page: pg, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (inStock) params.in_stock = true;
      if (sortBy) params.sort_by = sortBy;
      const response = await productsAPI.getAll(params);
      setProducts(response.data.products || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      const message = !error.response
        ? 'Network error. Please check your connection.'
        : error.response?.data?.detail || 'Failed to load products';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
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

  const handleWishlist = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    try {
      setWishlistLoading((prev) => ({ ...prev, [productId]: true }));
      if (wishlistIds.has(productId)) {
        await wishlistAPI.remove(productId);
        setWishlistIds((prev) => { const n = new Set(prev); n.delete(productId); return n; });
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(productId);
        setWishlistIds((prev) => new Set([...prev, productId]));
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">{total} product{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="form-input"
            style={{ paddingLeft: '34px', paddingRight: search ? '34px' : undefined }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}>
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input" style={{ width: 'auto', flex: '0 1 140px' }}>
          <option value="">All Categories</option>
          <option value="Women">Women</option>
          <option value="Men">Men</option>
          <option value="Electronics">Electronics</option>
          <option value="Accessories">Accessories</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input" style={{ width: 'auto', flex: '0 1 160px' }}>
          <option value="">Default Sort</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="newest">Newest First</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
          In Stock Only
        </label>
      </div>

      {loading ? (
        <Loading message="Loading products..." />
      ) : products.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-state-icon" />
          <h2 className="empty-state-title">No products found</h2>
          <p className="empty-state-description">{search ? `No results for "${search}"` : 'Check back later for new products'}</p>
          {search && <button onClick={() => setSearch('')} className="btn btn-secondary" style={{ marginTop: 'var(--spacing-md)' }}>Clear Search</button>}
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => {
              const stock = product.inventory?.quantity ?? 0;
              const isOutOfStock = stock <= 0;
              const isAdding = addingToCart[product.id];
              const isWishlisted = wishlistIds.has(product.id);
              const discounted = product.discount_percentage && parseFloat(product.discount_percentage) > 0;
              const discountedPrice = discounted
                ? parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)
                : null;

              return (
                <div key={product.id} className="product-card" style={{ position: 'relative' }}>
                  {/* Wishlist heart */}
                  <button
                    onClick={(e) => handleWishlist(product.id, e)}
                    disabled={wishlistLoading[product.id]}
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2, background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart style={{ width: '16px', height: '16px', fill: isWishlisted ? '#ef4444' : 'none', color: isWishlisted ? '#ef4444' : 'var(--color-text-light)' }} />
                  </button>

                  {discounted && (
                    <span style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2, backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '0.75rem' }}>
                      -{product.discount_percentage}%
                    </span>
                  )}
                  {product.is_new && !discounted && (
                    <span style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2, backgroundColor: '#10b981', color: 'white', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '0.75rem' }}>
                      NEW
                    </span>
                  )}

                  <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="product-image">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package />
                      )}
                    </div>
                    <div className="product-info">
                      {product.category && <span style={{ fontSize: '0.72rem', color: 'var(--color-accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{product.category}</span>}
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.description || 'No description available'}</p>
                    </div>
                    <div className="product-footer">
                      <div>
                        {discounted ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="product-price" style={{ color: '#ef4444' }}>${discountedPrice.toFixed(2)}</span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>${parseFloat(product.price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                        )}
                      </div>
                      <StockDot quantity={stock} />
                    </div>
                  </Link>

                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={isOutOfStock || isAdding}
                    className={`btn btn-full mt-md ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isAdding ? (
                      <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Adding...</>
                    ) : isOutOfStock ? (
                      'Out of Stock'
                    ) : (
                      <><Plus style={{ width: '16px', height: '16px' }} /> Add to Cart</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <button onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }} disabled={page === 1} className="btn btn-secondary">
                Previous
              </button>
              <span style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
              <button onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }} disabled={page === totalPages} className="btn btn-secondary">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
