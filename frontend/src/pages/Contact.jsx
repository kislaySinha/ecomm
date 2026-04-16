import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Message sent! We\'ll get back to you soon.');
    }, 800);
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label} *</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="form-input"
          rows={5}
          placeholder={placeholder}
          style={{ resize: 'vertical' }}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="form-input"
          placeholder={placeholder}
        />
      )}
      {errors[key] && <p className="form-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">We'd love to hear from you. Send us a message!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--spacing-2xl)' }}>
        {/* Contact Info */}
        <div>
          <div className="form-card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>Get in Touch</h2>
            {[
              { icon: MapPin, label: 'Address', text: '123 AmCart Avenue, Commerce City, CA 90001' },
              { icon: Phone, label: 'Phone', text: '+1 (800) 226-2788' },
              { icon: Mail, label: 'Email', text: 'support@amcart.com' },
              { icon: Clock, label: 'Hours', text: 'Mon–Fri, 9 AM – 6 PM PST' },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label} style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: '18px', height: '18px', color: 'white' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{label}</div>
                  <div style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="form-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>Leave a Reply</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
              {field('name', 'Name', 'text', 'Your name')}
              {field('email', 'Email', 'email', 'your@email.com')}
            </div>
            {field('subject', 'Subject', 'text', 'How can we help?')}
            {field('message', 'Message', 'textarea', 'Tell us more...')}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {submitting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: '16px', height: '16px' }} />}
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
