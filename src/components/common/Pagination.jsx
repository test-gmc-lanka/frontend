import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// First and last page always, plus a window around the current page; gaps become '…'
export function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['…', p] : [p]));
}

// Clamps a page number into range, e.g. after filtering leaves fewer pages
export function clampPage(page, totalItems, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(1, page), totalPages);
}

/**
 * "Showing 1 to 10 of 42 users" plus numbered page buttons. `page` should already be
 * clamped with clampPage so the summary and buttons agree.
 */
export default function Pagination({ page, totalItems, pageSize, onPageChange, itemLabel = 'items', style }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.9rem 1.25rem',
        ...style,
      }}
    >
      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
        {totalItems === 0 ? `No ${itemLabel}` : `Showing ${start} to ${end} of ${totalItems} ${itemLabel}`}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PageButton onClick={() => onPageChange(page - 1)} disabled={page === 1} label="Previous page">
          <FiChevronLeft size={16} />
        </PageButton>
        {getPageItems(page, totalPages).map((item, i) =>
          item === '…' ? (
            <span key={`gap-${i}`} style={{ width: 20, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
              …
            </span>
          ) : (
            <PageButton key={item} onClick={() => onPageChange(item)} active={item === page} label={`Page ${item}`}>
              {item}
            </PageButton>
          ),
        )}
        <PageButton onClick={() => onPageChange(page + 1)} disabled={page === totalPages} label="Next page">
          <FiChevronRight size={16} />
        </PageButton>
      </div>
    </nav>
  );
}

function PageButton({ children, onClick, disabled, active, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      style={{
        minWidth: 32,
        height: 32,
        padding: '0 6px',
        borderRadius: 6,
        border: active ? '1px solid var(--brand-accent)' : '1px solid #e5e7eb',
        background: active ? 'var(--brand-accent)' : '#fff',
        color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
        fontSize: '0.85rem',
        fontWeight: active ? 600 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}
