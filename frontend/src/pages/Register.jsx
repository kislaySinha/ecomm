import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, Store, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await register(email, password);
      toast.success('Account created successfully!');
      navigate('/products');
    } catch (error) {
      let message = 'Registration failed';
      if (!error.response) {
        message = 'Network error. Please check your connection.';
      } else if (error.response.status === 400) {
        message = error.response?.data?.detail || 'Email already registered';
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
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join AmCart and start shopping</p>
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
                placeholder="At least 6 characters"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <div className="input-icon-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input input-with-icon"
                placeholder="Confirm your password"
                disabled={loading}
                autoComplete="new-password"
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
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Create account
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
