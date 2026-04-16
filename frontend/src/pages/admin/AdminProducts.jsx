import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Save, X, Package, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';

const emptyForm = {
  name: '', price: '', description: '', category: '',
  image_url: '', initial_quantity: 0, is_featured: false, is_new: false, discount_percentage: ''
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [stockEdit, setStockEdit] = useState({}); // { productId: qty }

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getProducts(1, 100);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEditForm = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      category: product.category || '',
      image_url: product.image_url || '',
      initial_quantity: product.inventory?.quantity || 0,
      is_featured: product.is_featured || false,
      is_new: product.is_new || false,
      discount_percentage: product.discount_percentage || ''
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        description: form.description || null,
        category: form.category || null,
        image_url: form.image_url || null,
        is_featured: form.is_featured,
        is_new: form.is_new,
        discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage) : null,
        initial_quantity: parseInt(form.initial_quantity) || 0
      };
      if (editingId) {
        await adminAPI.updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await adminAPI.createProduct(payload);
        toast.success('Product created');
      }
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      setDeletingId(id);
      await adminAPI.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStockSave = async (productId) => {
    const qty = stockEdit[productId];
    if (qty === undefined || qty === '') return;
    try {
      await adminAPI.updateStock(productId, parseInt(qty));
      toast.success('Stock updated');
      setStockEdit((prev) => { const n = { ...prev }; delete n[productId]; return n; });
      fetchProducts();
    } catch {
      toast.error('Failed to update stock');
    }
  };

  if (loading) return <Loading message="Loading products..." />;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="page-title">Admin — Products</h1>
          <p className="page-subtitle">{total} products total</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={fetchProducts} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw style={{ width: '16px', height: '16px' }} /> Refresh
          </button>
          <button onClick={openAddForm} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus style={{ width: '16px', height: '16px' }} /> Add Product
          </button>
        </div>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ fontWeight: '700', fontSize: '1.1rem' }}>{editingId ? 'Edit Product' : 'Add Product'}</h2>
            <button onClick={() => setShowForm(false)} className="btn-icon"><X style={{ width: '18px', height: '18px' }} /></button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Price *</label>
                <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="form-input" placeholder="e.g. Women, Men" />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="url" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="form-input" placeholder="https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Stock</label>
                <input type="number" min="0" value={form.initial_quantity} onChange={(e) => setForm((f) => ({ ...f, initial_quantity: e.target.value }))} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Discount %</label>
                <input type="number" step="0.01" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm((f) => ({ ...f, discount_percentage: e.target.value }))} className="form-input" placeholder="0" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="form-input" rows={2} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} /> Featured
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_new} onChange={(e) => setForm((f) => ({ ...f, is_new: e.target.checked }))} /> New Arrival
              </label>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {saving ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '16px', height: '16px' }} />}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
              {['ID', 'Name', 'Price', 'Category', 'Stock', 'Featured', 'New', 'Discount', 'Actions'].map((h) => (
                <th key={h} style={{ padding: 'var(--spacing-sm)', color: 'var(--color-text-light)', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}>{product.id}</td>
                <td style={{ padding: 'var(--spacing-sm)', fontWeight: '500', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.image_url && <img src={product.image_url} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', marginRight: '6px', verticalAlign: 'middle' }} />}
                  {product.name}
                </td>
                <td style={{ padding: 'var(--spacing-sm)' }}>${parseFloat(product.price).toFixed(2)}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{product.category || '—'}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="0"
                      value={stockEdit[product.id] !== undefined ? stockEdit[product.id] : (product.inventory?.quantity ?? 0)}
                      onChange={(e) => setStockEdit((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      style={{ width: '60px', padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
                    />
                    {stockEdit[product.id] !== undefined && (
                      <button onClick={() => handleStockSave(product.id)} className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.8rem' }}>Set</button>
                    )}
                  </div>
                </td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{product.is_featured ? '✓' : '—'}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{product.is_new ? '✓' : '—'}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{product.discount_percentage ? `${product.discount_percentage}%` : '—'}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => openEditForm(product)} className="btn-icon" title="Edit" style={{ color: 'var(--color-accent)' }}>
                      <Edit2 style={{ width: '16px', height: '16px' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="btn-icon"
                      title="Delete"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      {deletingId === product.id ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="empty-state">
            <Package className="empty-state-icon" />
            <h2 className="empty-state-title">No products yet</h2>
            <p className="empty-state-description">Add your first product to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
