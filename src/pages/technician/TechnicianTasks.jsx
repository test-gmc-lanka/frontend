import { useState, useEffect } from 'react';
import { FiTool, FiRefreshCw } from 'react-icons/fi';
import api from '../../api/axios';
import { formatLKR, getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const TASK_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];

export default function TechnicianTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTasks = () =>
    api.get('/technician/tasks')
      .then((r) => setTasks(r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchTasks(); }, []);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await api.patch(`/technician/tasks/${id}/status`, null, { params: { status } });
      setTasks((prev) => prev.map((t) => (t.maintenanceId === id ? data : t)));
      toast.success('Task status updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="page-title flex items-center gap-3"><FiTool /> My Tasks</h1>
            <p className="page-subtitle">Manage assigned maintenance tasks</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setLoading(true); fetchTasks(); }}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiTool /></div>
            <h3>No tasks assigned</h3>
            <p>Check back later for new assignments</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tasks.map((task) => (
              <div key={task.maintenanceId} className="card">
                <div className="flex justify-between items-start">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ fontWeight: 700 }}>Task #{task.maintenanceId}</span>
                      <span className={`badge ${task.status === 'COMPLETED' ? 'badge-delivered' : task.status === 'IN_PROGRESS' ? 'badge-processing' : 'badge-pending'}`}>
                        {task.status || 'ASSIGNED'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                      {task.description}
                    </p>
                    <div className="flex gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {task.productName
                        ? <span>Product: <strong style={{ color: 'var(--text-primary)' }}>{task.productName}</strong></span>
                        : <span>Custom design: <strong style={{ color: 'var(--text-primary)' }}>{task.title}</strong></span>}
                      <span>Cost: <strong style={{ color: 'var(--color-primary)' }}>{formatLKR(task.cost)}</strong></span>
                    </div>
                    {task.imageUrls?.length > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                          Reference images ({task.imageUrls.length}) — click to open full size
                        </div>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                          {task.imageUrls.map((url, i) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer" title={`Open image ${i + 1}`}>
                              <img
                                src={url}
                                alt={`Reference ${i + 1} for task #${task.maintenanceId}`}
                                style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ marginLeft: '1rem', flexShrink: 0 }}>
                    <select
                      className="form-input"
                      style={{ padding: '0.375rem 0.5rem', fontSize: '0.8rem' }}
                      value={task.status || 'ASSIGNED'}
                      disabled={updatingId === task.maintenanceId || task.status === 'COMPLETED'}
                      onChange={(e) => handleStatusChange(task.maintenanceId, e.target.value)}
                    >
                      {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
