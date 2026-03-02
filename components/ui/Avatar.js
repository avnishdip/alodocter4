"use client";

export default function Avatar({ initials, size = 58, rounded = 18, gradient = true, className = '' }) {
  const style = {
    width: size,
    height: size,
    borderRadius: rounded,
    background: gradient
      ? 'linear-gradient(135deg, var(--gray-bg), var(--lavender-light))'
      : 'var(--lavender)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-heading)',
    fontSize: size * 0.35,
    fontWeight: 700,
    color: 'var(--navy)',
    flexShrink: 0,
  };

  return (
    <div style={style} className={className}>
      {initials}
    </div>
  );
}
