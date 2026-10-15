export default function LoadingSpinner({ center = true, size = 40 }) {
  const spinner = (
    <div
      style={{
        width: size, height: size,
        border: `3px solid var(--border)`,
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
  if (!center) return spinner;
  return <div className="loading-center">{spinner}</div>;
}
