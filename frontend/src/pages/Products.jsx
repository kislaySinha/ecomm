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
      <div className="empty-state animate-fade-in">
        <Package className="empty-state-icon" />
        <h2 className="empty-state-title">No products available</h2>
        <p className="empty-state-description">Check back later for new products</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <h1>Products</h1>
        <p className="mt-2 text-gray-600">Browse our collection of {products.length} products</p>
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
                <Package className="h-16 w-16 text-indigo-300" />
              </div>
              <div className="product-content">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-description">
                  {product.description || 'No description available'}
                </p>
                <div className="product-footer">
                  <span className="product-price">
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                  <span
                    className={`stock-badge ${
                      isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-available'
                    }`}
                  >
                    {isOutOfStock ? (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
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
                  className={`w-full mt-4 ${
                    isOutOfStock
                      ? 'btn btn-secondary opacity-50 cursor-not-allowed'
                      : 'btn btn-primary'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : isOutOfStock ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
