import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, CreditCard, Store, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-icon">
          <Store />
        </div>
        <h1 className="hero-title">
          Welcome to <span style={{ color: 'var(--color-accent)' }}>AmCart</span>
        </h1>
        <p className="hero-description">
          Your one-stop shop for amazing products. Fast checkout, secure payments, and great prices — all in one place.
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
    </div>
  );
}
