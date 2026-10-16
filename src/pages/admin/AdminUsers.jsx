import { useState, useEffect } from 'react';
import { FiPlus, FiUserX, FiUserCheck, FiX } from 'react-icons/fi';
import { adminGetUsers, adminCreateUser, adminDeactivateUser, adminActivateUser } from '../../api/users';
import { getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination, { clampPage } from '../../components/common/Pagination';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;
const emptyForm = { name: '', email: '', password: '', phone: '', address: '', role: 'CUSTOMER' };
const ROLES = ['CUSTOMER', 'ADMIN', 'TECHNICIAN'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null); // user awaiting activate/deactivate confirmation

  const fetchUsers = () =>
    adminGetUsers(roleFilter ? { role: roleFilter } : {})
      .then((r) => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));

  useEffect(() => { setLoading(true); setPage(1); fetchUsers(); }, [roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateUser(form);
      toast.success('User created!');
      setShowForm(false);
      setForm(emptyForm);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const user = confirmUser;
    setTogglingId(user.userId);
    try {
      if (user.active) {
        await adminDeactivateUser(user.userId);
        toast.success(`${user.name} deactivated`);
      } else {
        await adminActivateUser(user.userId);
        toast.success(`${user.name} activated`);
      }
      setConfirmUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const safePage = clampPage(page, filtered.length, PAGE_SIZE);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Users</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{users.length} users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><FiPlus /> Add User</button>
      </div>

      <div className="flex gap-3" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div className="flex gap-2">
          <button className={`filter-chip ${!roleFilter ? 'active' : ''}`} onClick={() => setRoleFilter('')}>All</button>
          {ROLES.map((r) => (
            <button key={r} className={`filter-chip ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(roleFilter === r ? '' : r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u) => (
              <tr key={u.userId}>
                <td>
                  <div className="flex items-center gap-2">
                    <Avatar src={u.profileImageUrl} name={u.name} size={32} />
                    <span style={{ fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.email}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.phone || '-'}</td>
                <td>
                  <span className="badge" style={{ background: 'rgba(0,200,215,0.15)', color: 'var(--color-primary)' }}>{u.role}</span>
                </td>
                <td>
                  <span className={`badge ${u.active ? 'badge-delivered' : 'badge-cancelled'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setConfirmUser(u)}
                    disabled={togglingId === u.userId}
                  >
                    {u.active ? <><FiUserX size={13} /> Deactivate</> : <><FiUserCheck size={13} /> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found</div>}
        <Pagination
          page={safePage}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="users"
          style={{ borderTop: '1px solid var(--border)' }}
        />
      </div>

      {confirmUser && (
        <ConfirmDialog
          title={confirmUser.active ? 'Deactivate user?' : 'Activate user?'}
          message={
            confirmUser.active
              ? <><strong>{confirmUser.name}</strong> ({confirmUser.email}) will no longer be able to sign in until reactivated.</>
              : <><strong>{confirmUser.name}</strong> ({confirmUser.email}) will be able to sign in again.</>
          }
          confirmLabel={confirmUser.active ? 'Deactivate' : 'Activate'}
          tone={confirmUser.active ? 'danger' : 'primary'}
          loading={togglingId === confirmUser.userId}
          onConfirm={handleToggle}
          onCancel={() => setConfirmUser(null)}
        />
      )}

      {/* Create user modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">Create New User</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} maxLength={72} required />
              </div>
              <div className="grid grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
