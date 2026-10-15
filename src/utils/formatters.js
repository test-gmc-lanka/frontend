export const formatLKR = (amount) => {
  if (amount == null) return 'LKR 0.00';
  return `LKR ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getStatusBadgeClass = (status) => {
  const map = {
    PENDING: 'badge-pending',
    PROCESSING: 'badge-processing',
    SHIPPED: 'badge-shipped',
    DELIVERED: 'badge-delivered',
    CANCELLED: 'badge-cancelled',
    CONFIRMED: 'badge-confirmed',
    COMPLETED: 'badge-completed',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    IN_PROGRESS: 'badge-in-progress',
    PENDING_REVIEW: 'badge-pending',
  };
  return map[status] || 'badge-pending';
};

export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
};
