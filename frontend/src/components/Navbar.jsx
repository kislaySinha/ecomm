import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Store, Menu, X, Heart, Tag, Phone, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" className="navbar-brand">
            <div className="navbar-logo">
              <Store />
            </div>
            <span>AmCart</span>
          </Link>
        </div>

        <ul className="navbar-links">
          <li>
            <Link to="/products" className="navbar-link">
              Products
            </Link>
          </li>
          <li>
            <Link to="/sale" className="navbar-link" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
              <Tag style={{ width: '14px', height: '14px' }} />
              Sale
            </Link>
          </li>
          <li>
            <Link to="/contact" className="navbar-link">
              Contact
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <Link to="/orders" className="navbar-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package style={{ width: '16px', height: '16px' }} />
                  Orders
                </Link>
              </li>

              <li className="cart-badge">
                <Link to="/wishlist" className="navbar-link" title="Wishlist">
                  <Heart style={{ width: '20px', height: '20px' }} />
                </Link>
              </li>

              <li className="cart-badge">
                <Link to="/cart" className="navbar-link">
                  <ShoppingCart style={{ width: '20px', height: '20px' }} />
                  {cartCount > 0 && (
                    <span className="cart-badge-count">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </li>

              {user?.is_admin && (
                <li>
                  <Link to="/admin/products" className="navbar-link" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)', fontWeight: '600' }}>
                    <Shield style={{ width: '14px', height: '14px' }} />
                    Admin
                  </Link>
                </li>
              )}

              <li className="navbar-user">
                <Link to="/profile" className="navbar-user-info" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <User style={{ width: '16px', height: '16px' }} />
                  <span>{user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-icon"
                  title="Logout"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <LogOut style={{ width: '16px', height: '16px' }} />
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="navbar-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-small btn-primary">
                  Get Started
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
