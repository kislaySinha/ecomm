import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Store, Menu, X } from 'lucide-react';
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-700 transition-colors">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AmCart</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/products"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Products
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/orders"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                >
                  <Package className="h-4 w-4" />
                  Orders
                </Link>

                <Link
                  to="/cart"
                  className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2.5 rounded-lg transition-all ml-1"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{user?.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm btn-inline">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && (
              <Link
                to="/cart"
                className="relative text-gray-600 p-2 rounded-lg"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-3 rounded-lg text-sm font-medium"
              >
                Products
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                  <div className="border-t border-gray-100 my-2"></div>
                  <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg text-sm font-medium text-left flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-3 rounded-lg text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary mx-4 mt-2"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
