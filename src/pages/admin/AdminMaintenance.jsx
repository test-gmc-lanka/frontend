import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiX, FiUpload, FiImage } from 'react-icons/fi';
import { adminGetMaintenance, adminAssignMaintenance, adminUploadMaintenanceImages } from '../../api/admin';
import { adminGetUsers } from '../../api/users';
import { getProducts } from '../../api/products';
import { formatLKR, getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination, { clampPage } from '../../components/common/Pagination';
import { deadlineInfo, formatDeadline, todayInputValue } from '../../utils/deadline';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const emptyForm = {
  taskType: 'PRODUCT',
  description: '',
  productId: '',
  title: '',
  technicianId: '',
  cost: '',
  imageUrls: [],
  deadline: '',
};

export default function AdminMaintenance() {
  const [tasks, setTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAll = () =>
    Promise.all([adminGetMaintenance(), adminGetUsers({ role: 'TECHNICIAN' }), getProducts()])
      .then(([m, t, p]) => {
        setTasks(m.data);
        setTechnicians(t.data);
        setProducts(p.data);
      })
      .catch(() => toast.error('Failed to load maintenance data'))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchAll();
  }, []);

  const isCustom = form.taskType === 'CUSTOM';

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    try {
      const { data: urls } = await adminUploadMaintenanceImages(files);
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...urls] }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((u) => u !== url) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAssignMaintenance({
        description: form.description,
        technicianId: Number(form.technicianId),
        cost: Number(form.cost),
        productId: isCustom ? null : Number(form.productId),
        title: isCustom ? form.title.trim() : null,
        deadline: form.deadline,
        imageUrls: form.imageUrls,
      });
      toast.success('Maintenance task assigned!');
      setShowForm(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Open tasks first, soonest deadline on top
  const sortedTasks = [...tasks].sort(
    (a, b) =>
      (a.status === 'COMPLETED') - (b.status === 'COMPLETED') ||
      (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31'),
  );
  const safePage = clampPage(page, sortedTasks.length, PAGE_SIZE);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Maintenance Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{tasks.length} tasks</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(emptyForm);
            setShowForm(true);
          }}
        >
          <FiPlus /> Assign Task
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Product / Design</th>
              <th>Images</th>
              <th>Technician</th>
              <th>Deadline</th>
              <th>Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE).map((t) => (
              <tr key={t.maintenanceId}>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.description}
                </td>
                <td>
                  {t.productName || t.title}
                  {!t.productName && t.title && (
                    <span
                      className="badge"
                      style={{ marginLeft: 6, background: 'rgba(245,158,11,0.15)', color: '#b45309' }}
                    >
                      Custom
                    </span>
                  )}
                </td>
                <td>
                  {t.imageUrls?.length ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {t.imageUrls.slice(0, 3).map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt=""
                            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                          />
                        </a>
                      ))}
                      {t.imageUrls.length > 3 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{t.imageUrls.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>{t.technicianName}</td>
                <td>
                  {(() => {
                    const info = deadlineInfo(t.deadline, t.status);
                    if (!info) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                    return (
                      <span
                        title={formatDeadline(t.deadline)}
                        style={{
                          background: info.bg,
                          color: info.color,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 20,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {info.label}
                      </span>
                    );
                  })()}
                </td>
                <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formatLKR(t.cost)}</td>
                <td>
                  <span
                    className={`badge badge-${t.status?.toLowerCase() === 'completed' ? 'delivered' : 'processing'}`}
                  >
                    {t.status || 'ASSIGNED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No maintenance tasks</div>
        )}
        <Pagination
          page={safePage}
          totalItems={sortedTasks.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="tasks"
          style={{ borderTop: '1px solid var(--border)' }}
        />
      </div>

      {/* Assign modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 className="modal-title">Assign Maintenance Task</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Task For *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`filter-chip ${!isCustom ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, taskType: 'PRODUCT' })}
                  >
                    Catalog Product
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${isCustom ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, taskType: 'CUSTOM' })}
                  >
                    Custom Design
                  </button>
                </div>
              </div>
              {isCustom ? (
                <div className="form-group">
                  <label className="form-label">Custom Design Name *</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Carved teak door panel"
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select
                    className="form-input"
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reference Images</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 6px' }}>
                  The assigned technician will see these with the task.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {form.imageUrls.map((url) => (
                    <div
                      key={url}
                      style={{
                        position: 'relative',
                        aspectRatio: '1 / 1',
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <img
                        src={url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        title="Remove image"
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          border: 'none',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.92)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      aspectRatio: '1 / 1',
                      border: '1.5px dashed var(--border-light, #d1d5db)',
                      borderRadius: 8,
                      background: 'transparent',
                      color: 'var(--text-secondary)',
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
                    {uploading ? <FiImage size={18} /> : <FiUpload size={18} />}
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
              <div className="form-group">
                <label className="form-label">Assign to Technician *</label>
                <select
                  className="form-input"
                  value={form.technicianId}
                  onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
                  required
                >
                  <option value="">Select technician</option>
                  {technicians.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-deadline">
                  Deadline *
                </label>
                <input
                  id="task-deadline"
                  type="date"
                  className="form-input"
                  min={todayInputValue()}
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  required
                />
                <span className="form-hint">
                  The technician sees this on their task list and in the assignment email.
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Cost (LKR) *</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving || uploading}>
                  {saving ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
