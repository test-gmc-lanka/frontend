import { useState, useEffect } from 'react';

/** Profile photo, falling back to the first letter of the name when there is none (or it fails to load). */
export default function Avatar({ src, name, size = 32, style }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  const base = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
  };

  if (src && !failed) {
    return (
      <span style={base}>
        <img
          src={src}
          alt={name ? `${name}'s profile photo` : 'Profile photo'}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...base,
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        color: '#fff', fontWeight: 700, fontSize: Math.round(size * 0.4),
      }}
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </span>
  );
}
