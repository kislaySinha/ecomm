import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Package, Loader2, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [stockInfo, setStockInfo] = useState({});
  const { addToCart, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll(0, 50);
      const productsList = response.data.products || [];
      setProducts(productsList);
      
      // Extract stock from product inventory (no separate API calls needed)
      const stockMap = {};
      productsList.forEach((p) => {
        stockMap[p.id] = p.inventory?.quantity || 0;
      });
      setStockInfo(stockMap);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      const message = !error.response 
        ? 'Network error. Please check your connection.'
        : error.response?.data?.detail || error.response?.data?.message || 'Failed to load products';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }));
      await addToCart(productId, 1);
      toast.success('Added to cart!');
      
      // Refresh products to get accurate stock after adding to cart
      await fetchProducts();
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to add to cart';
      toast.error(message);
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return <Loading message="Loading products..." />;
  }

  if (products.length === 0) {
    return (
      <div className="empty-state fade-in">
        <Package className="empty-state-icon" />
        <h2 className="empty-state-title">No products available</h2>
        <p className="empty-state-description">Check back later for new products</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">Browse our collection of {products.length} products</p>
      </div>

      <div className="product-grid">
        {products.map((product) => {
          const stock = stockInfo[product.id] ?? 0;
          const isOutOfStock = stock <= 0;
          const isLowStock = stock > 0 && stock <= 5;
          const isAdding = addingToCart[product.id];

          return (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <Package />
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">
                  {product.description || 'No description available'}
                </p>
              </div>
              <div className="product-footer">
                <span className="product-price">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
                <span
                  className={`product-stock ${
                    isOutOfStock ? 'product-stock-out' : isLowStock ? 'product-stock-low' : 'product-stock-available'
                  }`}
                >
                  {isOutOfStock ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '12px', height: '12px' }} />
                      Out of stock
                    </span>
                  ) : isLowStock ? (
                    `Only ${stock} left`
                  ) : (
                    `${stock} in stock`
                  )}
                </span>
              </div>
              <button
                onClick={() => handleAddToCart(product.id)}
                disabled={isOutOfStock || isAdding}
                className={`btn btn-full mt-md ${
                  isOutOfStock ? 'btn-secondary' : 'btn-primary'
                }`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isAdding ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Adding...
                  </>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  <>
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
