import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Read-only stars, e.g. <StarRating value={4.5} />. Half values round to the nearest star. */
export function Stars({ value, size = 14 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span
      role="img"
      aria-label={`${Number(value || 0).toFixed(1)} out of 5 stars`}
      style={{ display: 'inline-flex', gap: 2 }}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          size={size}
          aria-hidden="true"
          style={{ color: s <= rounded ? '#f59e0b' : '#d1d5db', fill: s <= rounded ? '#f59e0b' : 'transparent' }}
        />
      ))}
    </span>
  );
}

/** Clickable 1–5 star picker with a text label ("Very good"). */
export function StarPicker({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div
        role="radiogroup"
        aria-label="Rating"
        style={{ display: 'inline-flex', gap: 4 }}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            aria-label={`${s} star${s > 1 ? 's' : ''} – ${LABELS[s]}`}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', lineHeight: 0 }}
          >
            <FiStar
              size={size}
              style={{ color: s <= shown ? '#f59e0b' : '#d1d5db', fill: s <= shown ? '#f59e0b' : 'transparent' }}
            />
          </button>
        ))}
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: shown ? '#b45309' : '#9ca3af', minWidth: 72 }}>
        {shown ? LABELS[shown] : 'Choose'}
      </span>
    </div>
  );
}
