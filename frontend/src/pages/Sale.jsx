import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { Package, Loader2, Tag } from 'lucide-react';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';

export default function Sale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSale = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getAll({ limit: 100 });
        const discounted = (res.data.products || []).filter(
          (p) => p.discount_percentage && parseFloat(p.discount_percentage) > 0
        );
        setProducts(discounted);
      } catch {
        toast.error('Failed to load sale products');
      } finally {
        setLoading(false);
      }
    };
    loadSale();
  }, []);

  if (loading) return <Loading message="Loading sale..." />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title" style={{ color: '#ef4444' }}>Sale</h1>
        <p className="page-subtitle">{products.length} item{products.length !== 1 ? 's' : ''} on sale</p>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <Tag className="empty-state-icon" />
          <h2 className="empty-state-title">No sale items right now</h2>
          <p className="empty-state-description">Check back soon for great deals</p>
          <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
            Browse All Products
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => {
            const original = parseFloat(product.price);
            const discount = parseFloat(product.discount_percentage);
            const discounted = original * (1 - discount / 100);
            return (
              <Link to={`/products/${product.id}`} key={product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="product-card" style={{ cursor: 'pointer' }}>
                  <div className="product-image" style={{ position: 'relative' }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package />
                    )}
                    <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '0.8rem' }}>
                      -{discount}%
                    </span>
                  </div>
                  <div className="product-info">
                    {product.category && <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '600', textTransform: 'uppercase' }}>{product.category}</span>}
                    <h3 className="product-name">{product.name}</h3>
                  </div>
                  <div className="product-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="product-price" style={{ color: '#ef4444' }}>${discounted.toFixed(2)}</span>
                      <span style={{ textDecoration: 'line-through', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>${original.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
