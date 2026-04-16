import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, Store, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/products';

  // Redirect already authenticated users away from login
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.is_admin) {
        navigate('/admin/products', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const result = await login(email, password);
      toast.success('Welcome back!');
      if (result.user?.is_admin && from === '/products') {
        navigate('/admin/products', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      let message = 'Login failed';
      if (!error.response) {
        message = 'Network error. Please check your connection.';
      } else if (error.response.status === 401) {
        message = 'Invalid email or password';
      } else if (error.response.status === 422) {
        message = 'Invalid email format';
      } else {
        message = error.response?.data?.detail || error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card fade-in">
        <div className="form-header">
          <div className="form-logo">
            <div className="form-logo-icon">
              <Store />
            </div>
          </div>
          <h1 className="form-title">Welcome back</h1>
          <p className="form-subtitle">Sign in to your AmCart account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="form-input-icon-wrapper">
              <Mail className="form-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input form-input-with-icon"
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-icon-wrapper">
              <Lock className="form-input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input form-input-with-icon"
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full mt-md"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </>
            )}
          </button>
        </form>

        <p className="form-footer">
          Don't have an account?{' '}
          <Link to="/register" className="form-link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
