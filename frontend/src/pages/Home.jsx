import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, CreditCard, Store, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="animate-fade-in-up">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-icon">
          <Store className="h-12 w-12 sm:h-14 sm:w-14 text-indigo-600" />
        </div>
        <h1 className="hero-title">
          Welcome to <span className="text-indigo-600">AmCart</span>
        </h1>
        <p className="hero-description">
          Your one-stop shop for amazing products. Fast checkout, secure payments, and great prices — all in one place.
        </p>
        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary btn-lg btn-inline">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Browse Products
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-secondary btn-lg btn-inline">
              Create Account
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="section">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Why choose AmCart?</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            We make shopping simple, fast, and secure. Here's what sets us apart.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card card-hover">
            <div className="feature-icon bg-emerald-100">
              <Truck className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="feature-title">Free Shipping</h3>
            <p className="feature-description">
              Free shipping on all orders. No minimum purchase required. We deliver to your doorstep.
            </p>
          </div>

          <div className="feature-card card-hover">
            <div className="feature-icon bg-blue-100">
              <Shield className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="feature-title">Secure Shopping</h3>
            <p className="feature-description">
              Your data is protected with industry-standard encryption. Shop with confidence.
            </p>
          </div>

          <div className="feature-card card-hover">
            <div className="feature-icon bg-purple-100">
              <CreditCard className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="feature-title">Easy Payments</h3>
            <p className="feature-description">
              Multiple payment options for your convenience. Quick and hassle-free checkout.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section">
        <div className="cta">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-8 w-8 text-indigo-200" />
          </div>
          <h2 className="cta-title">Ready to start shopping?</h2>
          <p className="cta-description">
            Join thousands of happy customers and discover our amazing product selection today.
          </p>
          <Link 
            to="/products" 
            className="btn bg-white text-indigo-600 hover:bg-indigo-50 btn-lg btn-inline shadow-lg"
          >
            Shop Now
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
