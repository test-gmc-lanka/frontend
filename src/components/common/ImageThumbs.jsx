/** Row of small clickable thumbnails; each opens the full image in a new tab. */
export default function ImageThumbs({ urls, size = 56, label = 'Attached image' }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {urls.map((url, i) => (
        <a key={url} href={url} target="_blank" rel="noopener noreferrer" title={`Open ${label.toLowerCase()} ${i + 1}`}>
          <img
            src={url}
            alt={`${label} ${i + 1}`}
            style={{ width: size, height: size, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', display: 'block' }}
          />
        </a>
      ))}
    </div>
  );
}
