import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, CreditCard, Store, ArrowRight, Sparkles, Star, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';

const TESTIMONIALS = [
  { name: 'Sarah M.', rating: 5, text: 'Amazing products and super fast delivery! AmCart is my go-to shop now.' },
  { name: 'James T.', rating: 5, text: 'Great prices and easy checkout. Highly recommend to everyone!' },
  { name: 'Elena R.', rating: 4, text: 'Love the variety of products. The website is very easy to navigate.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);

  useEffect(() => {
    productsAPI.getAll({ is_featured: true, limit: 4 })
      .then((res) => setFeaturedProducts(res.data.products || []))
      .catch(() => {});
    productsAPI.getAll({ is_new: true, limit: 4 })
      .then((res) => setNewProducts(res.data.products || []))
      .catch(() => {});
  }, []);

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-icon">
          <Store />
        </div>
        <h1 className="hero-title">
          Welcome to <span style={{ color: 'var(--color-accent)' }}>AmCart</span> 🛒
        </h1>
        <p className="hero-description">
          Discover thousands of products at unbeatable prices. Fast checkout, secure payments, and doorstep delivery — shopping made effortless.
        </p>
        <div className="hero-actions">
          <Link to="/products" className="btn btn-large btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag style={{ width: '20px', height: '20px' }} />
            Browse Products
            <ArrowRight style={{ width: '20px', height: '20px' }} />
          </Link>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-large btn-secondary" style={{ display: 'inline-flex', alignItems: 'center' }}>
              Create Account
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div className="text-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: 'var(--spacing-sm)' }}>Why choose AmCart?</h2>
          <p style={{ color: 'var(--color-text-light)', maxWidth: '600px', margin: '0 auto' }}>
            We make shopping simple, fast, and secure. Here's what sets us apart.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: '#d1fae5' }}>
              <Truck style={{ width: '28px', height: '28px', color: '#059669' }} />
            </div>
            <h3 className="feature-title">Free Shipping</h3>
            <p className="feature-description">
              Free shipping on all orders. No minimum purchase required. We deliver to your doorstep.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: '#dbeafe' }}>
              <Shield style={{ width: '28px', height: '28px', color: '#2563eb' }} />
            </div>
            <h3 className="feature-title">Secure Shopping</h3>
            <p className="feature-description">
              Your data is protected with industry-standard encryption. Shop with confidence.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ backgroundColor: '#e9d5ff' }}>
              <CreditCard style={{ width: '28px', height: '28px', color: '#9333ea' }} />
            </div>
            <h3 className="feature-title">Easy Payments</h3>
            <p className="feature-description">
              Multiple payment options for your convenience. Quick and hassle-free checkout.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        backgroundColor: 'var(--color-accent)', 
        padding: 'var(--spacing-2xl)', 
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
          <Sparkles style={{ width: '32px', height: '32px', color: 'rgba(255, 255, 255, 0.8)' }} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: 'var(--spacing-sm)' }}>
          Ready to start shopping?
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.0625rem', marginBottom: 'var(--spacing-lg)', maxWidth: '500px', margin: '0 auto var(--spacing-lg)' }}>
          Join thousands of happy customers and discover our amazing product selection today.
        </p>
        <Link 
          to="/products" 
          className="btn btn-large"
          style={{ 
            backgroundColor: 'white', 
            color: 'var(--color-accent)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          Shop Now
          <ArrowRight style={{ width: '20px', height: '20px' }} />
        </Link>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Featured Products</h2>
            <Link to="/products" style={{ color: 'var(--color-accent)', fontSize: '0.9rem', fontWeight: '500' }}>View All →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            {featuredProducts.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="product-card" style={{ cursor: 'pointer' }}>
                  <div className="product-image" style={{ height: '160px' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package />}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name" style={{ fontSize: '0.95rem' }}>{p.name}</h3>
                    <span className="product-price">${parseFloat(p.price).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* New Products */}
      {newProducts.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>New Arrivals</h2>
            <Link to="/products?is_new=true" style={{ color: 'var(--color-accent)', fontSize: '0.9rem', fontWeight: '500' }}>View All →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            {newProducts.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="product-card" style={{ cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1, backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: '700', fontSize: '0.7rem' }}>NEW</span>
                  <div className="product-image" style={{ height: '160px' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package />}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name" style={{ fontSize: '0.95rem' }}>{p.name}</h3>
                    <span className="product-price">${parseFloat(p.price).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div className="text-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: 'var(--spacing-sm)' }}>What Our Customers Say</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t.name}</div>
                  <span style={{ color: '#f59e0b' }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: '1.5', fontStyle: 'italic' }}>"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
