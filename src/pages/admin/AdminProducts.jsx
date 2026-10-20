import { useState, useEffect, useMemo, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiStar, FiUpload, FiCheck } from 'react-icons/fi';
import {
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  setProductActive,
} from '../../api/products';
import { adminCreateCategory, adminGetProducts } from '../../api/admin';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatLKR, getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination, { clampPage } from '../../components/common/Pagination';
import toast from 'react-hot-toast';

const PAGE_SIZE = 4;
const emptyForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  material: '',
  imageUrl: '',
  imageUrls: [],
  stockQuantity: '',
};

function CategoryBadge({ name }) {
  const n = (name || '').toLowerCase();
  let bg, color;
  if (n.includes('cnc')) {
    bg = '#e6f4f1';
    color = '#0f766e';
  } else if (n.includes('artisan') || n.includes('wood')) {
    bg = '#dbeafe';
    color = '#1d4ed8';
  } else if (n.includes('precision') || n.includes('parts')) {
    bg = '#f3f4f6';
    color = '#374151';
  } else if (n.includes('furniture')) {
    bg = '#fef3c7';
    color = '#b45309';
  } else {
    bg = '#f3f4f6';
    color = '#6b7280';
  }
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {name || '—'}
    </span>
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
  const [search] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAll = () =>
    Promise.all([adminGetProducts(), getCategories()])
      .then(([p, c]) => {
        setProducts(p.data);
        setCategories(c.data);
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const safePage = clampPage(page, filtered.length, PAGE_SIZE);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetCategoryInput = () => {
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    resetCategoryInput();
    setShowForm(true);
  };
  const openEdit = (p) => {
    setEditItem(p);
    const imageUrls = p.imageUrls?.length ? p.imageUrls : p.imageUrl ? [p.imageUrl] : [];
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      categoryId: p.category?.categoryId || '',
      material: p.material || '',
      imageUrl: p.imageUrl || imageUrls[0] || '',
      imageUrls,
      stockQuantity: p.stockQuantity ?? '',
    });
    resetCategoryInput();
    setShowForm(true);
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    try {
      const { data } = await adminCreateCategory({ name });
      setCategories((prev) => [...prev, data]);
      setForm((f) => ({ ...f, categoryId: data.categoryId }));
      resetCategoryInput();
      toast.success(`Category "${data.name}" created`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    try {
      const { data: urls } = await uploadProductImages(files);
      setForm((f) => ({
        ...f,
        imageUrls: [...f.imageUrls, ...urls],
        imageUrl: f.imageUrl || urls[0] || '',
      }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => {
    setForm((f) => {
      const imageUrls = f.imageUrls.filter((u) => u !== url);
      return { ...f, imageUrls, imageUrl: f.imageUrl === url ? imageUrls[0] || '' : f.imageUrl };
    });
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

  // Archiving keeps the product on past orders and reviews but removes it from the shop and carts
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await deleteProduct(archiveTarget.productId);
      setProducts((prev) => prev.map((p) => (p.productId === archiveTarget.productId ? { ...p, active: false } : p)));
      toast.success(`"${archiveTarget.name}" archived`);
      setArchiveTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async (p) => {
    try {
      const { data } = await setProductActive(p.productId, true);
      setProducts((prev) => prev.map((x) => (x.productId === data.productId ? data : x)));
      toast.success(`"${p.name}" is back in the shop`);
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
            Inventory management for precision CNC machinery and artisanal wood product lines.
            <br />
            Control stock levels, pricing, and visibility.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#0f766e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.65rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Table card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div className="scroll-x">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['IMAGE', 'NAME', 'CATEGORY', 'PRICE', 'STOCK', 'ACTIONS'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.75rem 1.25rem',
                      textAlign: 'left',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#9ca3af',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {h}
                  </th>
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
              ) : (
                paginated.map((p, idx) => (
                  <tr
                    key={p.productId}
                    style={{
                      opacity: p.active === false ? 0.6 : 1,
                      borderBottom: idx < paginated.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}
                  >
                    {/* Image */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {p.imageUrl ? (
                        <div style={{ position: 'relative', width: 60, height: 60 }}>
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                          />
                          {p.imageUrls?.length > 1 && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: 3,
                                right: 3,
                                background: 'rgba(17,24,39,0.75)',
                                color: '#fff',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: 4,
                              }}
                            >
                              +{p.imageUrls.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            background: '#f3f4f6',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                          }}
                        >
                          🪵
                        </div>
                      )}
                    </td>

                    {/* Name + subtitle */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.92rem' }}>
                        {p.name}
                        {p.active === false && (
                          <span
                            style={{
                              marginLeft: 8,
                              background: '#f3f4f6',
                              color: '#6b7280',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 20,
                            }}
                          >
                            ARCHIVED
                          </span>
                        )}
                      </div>
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
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#f59e0b',
                            padding: 4,
                          }}
                        >
                          <FiEdit2 size={17} />
                        </button>
                        {p.active === false ? (
                          <button
                            onClick={() => handleRestore(p)}
                            title="Restore to the shop"
                            aria-label={`Restore ${p.name}`}
                            style={{
                              background: 'none',
                              border: '1px solid #99f6e4',
                              borderRadius: 6,
                              cursor: 'pointer',
                              color: '#0f766e',
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => setArchiveTarget(p)}
                            title="Archive (remove from the shop)"
                            aria-label={`Archive ${p.name}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: 4,
                            }}
                          >
                            <FiTrash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="products"
          style={{ borderTop: '1px solid #e5e7eb' }}
        />
      </div>

      {archiveTarget && (
        <ConfirmDialog
          title="Archive this product?"
          message={
            <>
              <strong>{archiveTarget.name}</strong> will be removed from the shop and from customers&rsquo; carts. Past
              orders and reviews keep it, and you can restore it any time.
            </>
          }
          confirmLabel="Archive"
          tone="danger"
          loading={archiving}
          onConfirm={handleArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '100%',
              maxWidth: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
                {editItem ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={labelStyle}>Category *</label>
                    {!showNewCategory && (
                      <button type="button" onClick={() => setShowNewCategory(true)} style={linkButtonStyle}>
                        <FiPlus size={12} /> New
                      </button>
                    )}
                  </div>
                  {showNewCategory ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        style={inputStyle}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategory();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            resetCategoryInput();
                          }
                        }}
                        placeholder="New category name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
                        title="Create category"
                        style={{ ...iconButtonStyle, background: '#0f766e', color: '#fff', borderColor: '#0f766e' }}
                      >
                        <FiCheck size={15} />
                      </button>
                      <button type="button" onClick={resetCategoryInput} title="Cancel" style={iconButtonStyle}>
                        <FiX size={15} />
                      </button>
                    </div>
                  ) : (
                    <select
                      style={inputStyle}
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Material</label>
                  <input
                    style={inputStyle}
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    placeholder="e.g. Teak Wood"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Price (LKR) *</label>
                  <input
                    type="number"
                    style={inputStyle}
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Stock Quantity *</label>
                  <input
                    type="number"
                    style={inputStyle}
                    min="0"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Product Images</label>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 8px' }}>
                  Click the star to choose the cover image shown on the products page.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {form.imageUrls.map((url) => {
                    const isCover = url === form.imageUrl;
                    return (
                      <div
                        key={url}
                        style={{
                          position: 'relative',
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: isCover ? '2px solid #0f766e' : '1px solid #e5e7eb',
                          aspectRatio: '1 / 1',
                          background: '#f3f4f6',
                        }}
                      >
                        <img
                          src={url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, imageUrl: url })}
                          title={isCover ? 'Cover image' : 'Set as cover image'}
                          style={{ ...thumbButtonStyle, left: 4, color: isCover ? '#f59e0b' : '#6b7280' }}
                        >
                          <FiStar size={13} fill={isCover ? '#f59e0b' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          title="Remove image"
                          style={{ ...thumbButtonStyle, right: 4, color: '#ef4444' }}
                        >
                          <FiX size={13} />
                        </button>
                        {isCover && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'rgba(15,118,110,0.9)',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              padding: '2px 0',
                            }}
                          >
                            COVER
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      aspectRatio: '1 / 1',
                      border: '1.5px dashed #d1d5db',
                      borderRadius: 8,
                      background: '#f9fafb',
                      color: '#6b7280',
                      cursor: uploading ? 'wait' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    <FiUpload size={18} />
                    {uploading ? 'Uploading...' : 'Add images'}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                    color: '#374151',
                    fontSize: '0.9rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    border: 'none',
                    borderRadius: 8,
                    background: '#0f766e',
                    color: '#fff',
                    cursor: saving || uploading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    opacity: saving || uploading ? 0.7 : 1,
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
  display: 'block',
  marginBottom: 5,
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#374151',
};

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: 7,
  fontSize: '0.875rem',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

const linkButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  marginBottom: 5,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: '#0f766e',
  fontSize: '0.78rem',
  fontWeight: 600,
};

const iconButtonStyle = {
  flexShrink: 0,
  width: 34,
  border: '1px solid #d1d5db',
  borderRadius: 7,
  background: '#fff',
  color: '#374151',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const thumbButtonStyle = {
  position: 'absolute',
  top: 4,
  width: 22,
  height: 22,
  border: 'none',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.92)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
};
