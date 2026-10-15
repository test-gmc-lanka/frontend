import { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../../api/products';
import { formatLKR, getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PAGE_SIZE = 4;
const emptyForm = { name: '', description: '', price: '', categoryId: '', material: '', imageUrl: '', stockQuantity: '' };

function CategoryBadge({ name }) {
  const n = (name || '').toLowerCase();
  let bg, color;
  if (n.includes('cnc')) { bg = '#e6f4f1'; color = '#0f766e'; }
  else if (n.includes('artisan') || n.includes('wood')) { bg = '#dbeafe'; color = '#1d4ed8'; }
  else if (n.includes('precision') || n.includes('parts')) { bg = '#f3f4f6'; color = '#374151'; }
  else if (n.includes('furniture')) { bg = '#fef3c7'; color = '#b45309'; }
  else { bg = '#f3f4f6'; color = '#6b7280'; }
  return (
    <span style={{
      background: bg, color, fontSize: '0.75rem', fontWeight: 600,
      padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>{name || '—'}</span>
  );
}

function StockDot({ qty }) {
  const color = qty === 0 ? '#ef4444' : qty <= 5 ? '#f59e0b' : '#22c55e';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontWeight: 500, color: '#374151' }}>{qty} Units</span>
    </span>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAll = () =>
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => { setProducts(p.data); setCategories(c.data); })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() =>
    products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filtered.length);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      name: p.name, description: p.description || '', price: p.price,
      categoryId: p.category?.categoryId || '', material: p.material || '',
      imageUrl: p.imageUrl || '', stockQuantity: p.stockQuantity ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        categoryId: Number(form.categoryId),
        stockQuantity: Number(form.stockQuantity),
      };
      if (editItem) {
        await updateProduct(editItem.productId, payload);
        toast.success('Product updated!');
      } else {
        await createProduct(payload);
        toast.success('Product created!');
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      setProducts((prev) => prev.filter((p) => p.productId !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '2.5rem 2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.4rem' }}>
            Manage Products
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: 480, lineHeight: 1.5 }}>
            Inventory management for precision CNC machinery and artisanal wood product lines.<br />
            Control stock levels, pricing, and visibility.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#0f766e', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Table card */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['IMAGE', 'NAME', 'CATEGORY', 'PRICE', 'STOCK', 'ACTIONS'].map((h) => (
                <th key={h} style={{
                  padding: '0.75rem 1.25rem', textAlign: 'left',
                  fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
                  No products found
                </td>
              </tr>
            ) : paginated.map((p, idx) => (
              <tr key={p.productId} style={{
                borderBottom: idx < paginated.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                {/* Image */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl} alt={p.name}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                    />
                  ) : (
                    <div style={{
                      width: 60, height: 60, background: '#f3f4f6',
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}>🪵</div>
                  )}
                </td>

                {/* Name + subtitle */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.92rem' }}>{p.name}</div>
                  {p.material && (
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>{p.material}</div>
                  )}
                </td>

                {/* Category badge */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <CategoryBadge name={p.category?.name} />
                </td>

                {/* Price */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>
                    {p.price === 0 ? 'Quote' : formatLKR(p.price)}
                  </span>
                </td>

                {/* Stock */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <StockDot qty={p.stockQuantity ?? 0} />
                </td>

                {/* Actions */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openEdit(p)}
                      title="Edit"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#f59e0b', padding: 4,
                      }}
                    >
                      <FiEdit2 size={17} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.productId)}
                      title="Delete"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ef4444', padding: 4,
                      }}
                    >
                      <FiTrash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.9rem 1.25rem', borderTop: '1px solid #e5e7eb',
        }}>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {filtered.length === 0
              ? 'No products'
              : `Showing ${start} to ${end} of ${filtered.length} products`}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                width: 32, height: 32, border: '1px solid #e5e7eb', borderRadius: 6,
                background: '#fff', cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: safePage === 1 ? '#d1d5db' : '#374151',
              }}
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                width: 32, height: 32, border: '1px solid #e5e7eb', borderRadius: 6,
                background: '#fff', cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: safePage === totalPages ? '#d1d5db' : '#374151',
              }}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
        >
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 540,
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb',
            }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
                {editItem ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select style={inputStyle} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Material</label>
                  <input style={inputStyle} value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="e.g. Teak Wood" />
                </div>
                <div>
                  <label style={labelStyle}>Price (LKR) *</label>
                  <input type="number" style={inputStyle} min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Stock Quantity *</label>
                  <input type="number" style={inputStyle} min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Image URL</label>
                <input style={inputStyle} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1, padding: '0.65rem', border: '1px solid #e5e7eb',
                    borderRadius: 8, background: '#fff', cursor: 'pointer',
                    fontWeight: 500, color: '#374151', fontSize: '0.9rem',
                  }}
                >Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1, padding: '0.65rem', border: 'none',
                    borderRadius: 8, background: '#0f766e', color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.9rem', opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : editItem ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', marginBottom: 5,
  fontSize: '0.82rem', fontWeight: 600, color: '#374151',
};

const inputStyle = {
  width: '100%', padding: '0.55rem 0.75rem',
  border: '1px solid #d1d5db', borderRadius: 7,
  fontSize: '0.875rem', color: '#111827',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};
