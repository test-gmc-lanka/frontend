import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiEye, FiEyeOff } from 'react-icons/fi';
import {
  adminGetFeedback, adminGetComplaints, adminUpdateComplaintStatus, adminSetFeedbackVisibility,
} from '../../api/admin';
import { formatDateTime, getErrorMessage } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination, { clampPage } from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// Rating filters admins typically use: follow up on low ratings first
const RATING_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'low', label: 'Needs attention (1–2★)', match: (f) => f.rating <= 2 },
  { key: 'mid', label: 'Average (3★)', match: (f) => f.rating === 3 },
  { key: 'high', label: 'Positive (4–5★)', match: (f) => f.rating >= 4 },
  { key: 'hidden', label: 'Hidden', match: (f) => f.hidden },
];

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
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [complaintPage, setComplaintPage] = useState(1);
  const [feedback, setFeedback] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [togglingId, setTogglingId] = useState(null);

  const [hideTarget, setHideTarget] = useState(null);

  const toggleHidden = async (f) => {
    const hide = !f.hidden;
    if (hide && hideTarget?.feedbackId !== f.feedbackId) { setHideTarget(f); return; }
    setHideTarget(null);
    setTogglingId(f.feedbackId);
    try {
      const { data } = await adminSetFeedbackVisibility(f.feedbackId, hide);
      setFeedback((prev) => prev.map((x) => (x.feedbackId === data.feedbackId ? data : x)));
      toast.success(hide ? 'Review hidden from the product page' : 'Review is visible again');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    Promise.all([adminGetFeedback(), adminGetComplaints()])
      .then(([f, c]) => { setFeedback(f.data); setComplaints(c.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  // The customer is notified of both changes (resolved also by email)
  const updateComplaint = async (id, status) => {
    setResolvingId(id);
    try {
      const { data } = await adminUpdateComplaintStatus(id, status);
      setComplaints((prev) => prev.map((c) => (c.complaintId === id ? data : c)));
      toast.success(status === 'RESOLVED' ? 'Complaint resolved — customer notified' : 'Marked as being handled — customer notified');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResolvingId(null);
    }
  };

  // Newest first so the latest reviews and complaints are on page 1
  const byNewest = (dateKey) => (a, b) => new Date(b[dateKey]) - new Date(a[dateKey]);
  const activeFilter = RATING_FILTERS.find((r) => r.key === ratingFilter) || RATING_FILTERS[0];
  const sortedFeedback = feedback.filter(activeFilter.match).sort(byNewest('createdAt'));
  const visibleReviews = feedback.filter((f) => !f.hidden);
  const averageRating = visibleReviews.length
    ? (visibleReviews.reduce((sum, f) => sum + f.rating, 0) / visibleReviews.length).toFixed(1)
    : null;
  const lowCount = feedback.filter((f) => f.rating <= 2 && !f.hidden).length;
  const sortedComplaints = [...complaints].sort(byNewest('date'));
  const fbPage = clampPage(feedbackPage, sortedFeedback.length, PAGE_SIZE);
  const cPage = clampPage(complaintPage, sortedComplaints.length, PAGE_SIZE);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Feedback & Complaints</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'feedback' ? 'active' : ''}`} onClick={() => setTab('feedback')}>
          Reviews ({feedback.length})
        </button>
        <button className={`tab ${tab === 'complaints' ? 'active' : ''}`} onClick={() => setTab('complaints')}>
          Complaints ({complaints.length})
        </button>
      </div>

      {tab === 'feedback' && (
        <>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              {averageRating
                ? <>Average <strong style={{ color: 'var(--text-primary)' }}>{averageRating} ★</strong> from {visibleReviews.length} visible review{visibleReviews.length !== 1 ? 's' : ''}</>
                : 'No visible reviews yet'}
              {lowCount > 0 && <span style={{ color: 'var(--danger)', fontWeight: 600 }}> · {lowCount} need attention</span>}
            </div>
            {RATING_FILTERS.map((r) => (
              <button
                key={r.key}
                className={`filter-chip ${ratingFilter === r.key ? 'active' : ''}`}
                onClick={() => { setRatingFilter(r.key); setFeedbackPage(1); }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Visibility</th></tr></thead>
              <tbody>
                {sortedFeedback.slice((fbPage - 1) * PAGE_SIZE, fbPage * PAGE_SIZE).map((f) => (
                  <tr key={f.feedbackId} style={{ opacity: f.hidden ? 0.6 : 1 }}>
                    <td>
                      <div className="flex items-center gap-2">
                        {f.productImageUrl
                          ? <img src={f.productImageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                          : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-primary)', flexShrink: 0 }} />}
                        <div style={{ minWidth: 0 }}>
                          {f.productId
                            ? <Link to={`/products/${f.productId}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.productName}</Link>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order #{f.orderId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{f.userName}</div>
                      {f.userEmail && (
                        <a href={`mailto:${f.userEmail}`} style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{f.userEmail}</a>
                      )}
                    </td>
                    <td><StarRating rating={f.rating} /></td>
                    <td style={{ maxWidth: 320, color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{f.comment}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatDateTime(f.createdAt)}
                      {f.updatedAt && <div>Edited {formatDateTime(f.updatedAt)}</div>}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${f.hidden ? 'btn-secondary' : 'btn-ghost'}`}
                        disabled={togglingId === f.feedbackId}
                        onClick={() => toggleHidden(f)}
                        title={f.hidden ? 'Show on the product page again' : 'Hide from the product page'}
                      >
                        {f.hidden ? <><FiEye size={13} /> Show</> : <><FiEyeOff size={13} /> Hide</>}
                      </button>
                      {f.hidden && <div style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: 4 }}>Hidden</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedFeedback.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {feedback.length === 0 ? 'No reviews yet' : 'No reviews match this filter'}
              </div>
            )}
            <Pagination page={fbPage} totalItems={sortedFeedback.length} pageSize={PAGE_SIZE}
              onPageChange={setFeedbackPage} itemLabel="reviews" style={{ borderTop: '1px solid var(--border)' }} />
          </div>
        </>
      )}

      {tab === 'complaints' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>About</th><th>Description</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {sortedComplaints.slice((cPage - 1) * PAGE_SIZE, cPage * PAGE_SIZE).map((c) => (
                <tr key={c.complaintId}>
                  <td>{c.userName}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {c.productName || (c.orderId ? 'Order' : 'General')}
                    {c.orderId && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order #{c.orderId}</div>}
                  </td>
                  <td style={{ maxWidth: 300, fontSize: '0.875rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.description}</td>
                  <td><span className={`badge ${c.status === 'RESOLVED' ? 'badge-delivered' : c.status === 'IN_PROGRESS' ? 'badge-processing' : 'badge-pending'}`}>{(c.status || 'OPEN').replace('_', ' ')}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateTime(c.date)}</td>
                  <td>
                    {c.status === 'OPEN' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginRight: 6 }}
                        disabled={resolvingId === c.complaintId}
                        onClick={() => updateComplaint(c.complaintId, 'IN_PROGRESS')}
                      >
                        Start handling
                      </button>
                    )}
                    {c.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={resolvingId === c.complaintId}
                        onClick={() => updateComplaint(c.complaintId, 'RESOLVED')}
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
          <Pagination page={cPage} totalItems={sortedComplaints.length} pageSize={PAGE_SIZE}
            onPageChange={setComplaintPage} itemLabel="complaints" style={{ borderTop: '1px solid var(--border)' }} />
        </div>
      )}
      {hideTarget && (
        <ConfirmDialog
          title="Hide this review?"
          message={<>{hideTarget.userName}&rsquo;s review of <strong>{hideTarget.productName}</strong> will be removed from the product page and its rating. The customer will see that it was hidden. You can show it again later.</>}
          confirmLabel="Hide review"
          tone="warning"
          loading={togglingId === hideTarget.feedbackId}
          onConfirm={() => toggleHidden(hideTarget)}
          onCancel={() => setHideTarget(null)}
        />
      )}
    </div>
  );
}
