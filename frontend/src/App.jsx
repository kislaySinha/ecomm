import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Sale from './pages/Sale';
import Reviews from './pages/Reviews';
import AdminProducts from './pages/admin/AdminProducts';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="sale" element={<Sale />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="contact" element={<Contact />} />
              <Route
                path="cart"
                element={<ProtectedRoute><Cart /></ProtectedRoute>}
              />
              <Route
                path="orders"
                element={<ProtectedRoute><Orders /></ProtectedRoute>}
              />
              <Route
                path="wishlist"
                element={<ProtectedRoute><Wishlist /></ProtectedRoute>}
              />
              <Route
                path="profile"
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
              />
              <Route
                path="admin/products"
                element={<AdminRoute><AdminProducts /></AdminRoute>}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
