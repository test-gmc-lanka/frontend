// Small wood-coloured label above a section title, used on the Home, About and Contact pages
export default function SectionHeading({ eyebrow, title, noMargin, as: Tag = 'h2' }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : '1.75rem' }}>
      <div className="eyebrow-label" style={{ color: 'var(--wood-400)', marginBottom: '0.5rem' }}>
        {eyebrow}
      </div>
      <Tag style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#1f2328', lineHeight: 1.2 }}>
        {title}
      </Tag>
    </div>
  );
}
