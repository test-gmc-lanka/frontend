import { useState, useEffect } from 'react';
import { FiTool, FiPlus, FiX } from 'react-icons/fi';
import { adminGetMaintenance, adminAssignMaintenance } from '../../api/admin';
import { adminGetUsers } from '../../api/users';
import { getProducts } from '../../api/products';
import { formatLKR, getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const emptyForm = { description: '', productId: '', technicianId: '', cost: '' };

export default function AdminMaintenance() {
  const [tasks, setTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAll = () =>
    Promise.all([
      adminGetMaintenance(),
      adminGetUsers({ role: 'TECHNICIAN' }),
      getProducts(),
    ])
      .then(([m, t, p]) => {
        setTasks(m.data);
        setTechnicians(t.data);
        setProducts(p.data);
      })
      .catch(() => toast.error('Failed to load maintenance data'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAssignMaintenance({ ...form, productId: Number(form.productId), technicianId: Number(form.technicianId), cost: Number(form.cost) });
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Maintenance Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{tasks.length} tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><FiPlus /> Assign Task</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Product</th>
              <th>Technician</th>
              <th>Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.maintenanceId}>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                <td>{t.productName}</td>
                <td>{t.technicianName}</td>
                <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formatLKR(t.cost)}</td>
                <td><span className={`badge badge-${t.status?.toLowerCase() === 'completed' ? 'delivered' : 'processing'}`}>{t.status || 'ASSIGNED'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No maintenance tasks</div>}
      </div>

      {/* Assign modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">Assign Maintenance Task</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Product *</label>
                <select className="form-input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.productId} value={p.productId}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign to Technician *</label>
                <select className="form-input" value={form.technicianId} onChange={(e) => setForm({ ...form, technicianId: e.target.value })} required>
                  <option value="">Select technician</option>
                  {technicians.map((t) => <option key={t.userId} value={t.userId}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cost (LKR) *</label>
                <input type="number" className="form-input" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
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
