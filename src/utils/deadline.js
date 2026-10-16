// Deadlines come from the backend as "YYYY-MM-DD" (no time zone); parse them as local dates
function parseLocalDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDeadline(value) {
  if (!value) return '—';
  return parseLocalDate(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function todayInputValue() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** Label + colours for a task deadline, e.g. "Overdue by 2 days" in red. */
export function deadlineInfo(value, status) {
  if (!value) return null;
  const date = formatDeadline(value);
  if (status === 'COMPLETED') return { label: `Due ${date}`, color: '#6b7280', bg: '#f3f4f6' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((parseLocalDate(value) - today) / 86400000);
  if (days < 0) {
    const n = -days;
    return { label: `Overdue by ${n} day${n > 1 ? 's' : ''}`, color: '#b91c1c', bg: '#fee2e2', urgent: true };
  }
  if (days === 0) return { label: 'Due today', color: '#c2410c', bg: '#ffedd5', urgent: true };
  if (days <= 2) return { label: `Due in ${days} day${days > 1 ? 's' : ''}`, color: '#b45309', bg: '#fef3c7' };
  return { label: `Due ${date}`, color: '#0f766e', bg: '#e6f4f1' };
}
