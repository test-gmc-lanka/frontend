// Shared inline styles for the content pages (Home, About, Contact)
export const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  background: '#fff',
  border: '1px solid #e7e1d8',
  borderRadius: 10,
  padding: '1.5rem',
  boxShadow: '0 1px 2px rgba(46, 26, 14, 0.04)',
};

export const iconBoxStyle = {
  width: 44,
  height: 44,
  borderRadius: 10,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, var(--wood-400), var(--wood-700))',
  color: '#f6ead9',
};

export const stepNumberStyle = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(180deg, #f3f5f7, #b9c1c8)',
  border: '1px solid #8a949d',
  color: 'var(--wood-900)',
  fontWeight: 800,
  fontSize: '0.9rem',
};

export const mutedText = { color: '#5b6168', lineHeight: 1.65 };
