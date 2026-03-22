import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, Store, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/products';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
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
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="bg-indigo-600 p-3 rounded-xl">
              <Store className="auth-logo-icon text-white" />
            </div>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your AmCart account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-icon-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-with-icon"
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-with-icon"
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
