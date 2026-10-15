import { useState, useEffect } from 'react';
import { FiStar, FiMessageSquare } from 'react-icons/fi';
import { adminGetFeedback, adminGetComplaints, adminUpdateComplaintStatus } from '../../api/admin';
import { formatDateTime, getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function StarRating({ rating }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar key={s} size={14} style={{ color: s <= rating ? 'var(--warning)' : 'var(--border)', fill: s <= rating ? 'var(--warning)' : 'transparent' }} />
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const [tab, setTab] = useState('feedback');
  const [feedback, setFeedback] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    Promise.all([adminGetFeedback(), adminGetComplaints()])
      .then(([f, c]) => { setFeedback(f.data); setComplaints(c.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const resolveComplaint = async (id) => {
    setResolvingId(id);
    try {
      const { data } = await adminUpdateComplaintStatus(id, 'RESOLVED');
      setComplaints((prev) => prev.map((c) => (c.complaintId === id ? data : c)));
      toast.success('Complaint resolved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Feedback & Complaints</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'feedback' ? 'active' : ''}`} onClick={() => setTab('feedback')}>
          Feedback ({feedback.length})
        </button>
        <button className={`tab ${tab === 'complaints' ? 'active' : ''}`} onClick={() => setTab('complaints')}>
          Complaints ({complaints.length})
        </button>
      </div>

      {tab === 'feedback' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Order</th><th>Product</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
            <tbody>
              {feedback.map((f) => (
                <tr key={f.feedbackId}>
                  <td>{f.userName}</td>
                  <td>#{f.orderId}</td>
                  <td>{f.productId ? `#${f.productId}` : '-'}</td>
                  <td><StarRating rating={f.rating} /></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{f.comment}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateTime(f.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {feedback.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No feedback yet</div>}
        </div>
      )}

      {tab === 'complaints' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Description</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.complaintId}>
                  <td>{c.userName}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{c.description}</td>
                  <td><span className={`badge ${c.status === 'RESOLVED' ? 'badge-delivered' : 'badge-pending'}`}>{c.status || 'OPEN'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateTime(c.date)}</td>
                  <td>
                    {c.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={resolvingId === c.complaintId}
                        onClick={() => resolveComplaint(c.complaintId)}
                      >
                        {resolvingId === c.complaintId ? 'Resolving...' : 'Resolve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {complaints.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No complaints yet</div>}
        </div>
      )}
    </div>
  );
}
