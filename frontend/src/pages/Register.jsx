import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, Store, UserPlus, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
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
      await register(email, password, fullName, phone);
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
    <div className="form-container">
      <div className="form-card fade-in">
        <div className="form-header">
          <div className="form-logo">
            <div className="form-logo-icon">
              <Store />
            </div>
          </div>
          <h1 className="form-title">Create account</h1>
          <p className="form-subtitle">Join AmCart and start shopping</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>(optional)</span></label>
            <div className="form-input-icon-wrapper">
              <User className="form-input-icon" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input form-input-with-icon"
                placeholder="Your full name"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>(optional)</span></label>
            <div className="form-input-icon-wrapper">
              <Phone className="form-input-icon" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input form-input-with-icon"
                placeholder="+1 234 567 8900"
                disabled={loading}
              />
            </div>
          </div>

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
                placeholder="At least 6 characters"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <div className="form-input-icon-wrapper">
              <Lock className="form-input-icon" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input form-input-with-icon"
                placeholder="Confirm your password"
                disabled={loading}
                autoComplete="new-password"
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
                Creating account...
              </>
            ) : (
              <>
                <UserPlus style={{ width: '20px', height: '20px' }} />
                Create account
              </>
            )}
          </button>
        </form>

        <p className="form-footer">
          Already have an account?{' '}
          <Link to="/login" className="form-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
