"use client";

const STATUS_CONFIG = {
  booked: { label: 'Booked', bg: 'var(--primary-50)', color: 'var(--primary-700)' },
  confirmed: { label: 'Confirmed', bg: 'var(--green-50)', color: 'var(--green-600)' },
  pending: { label: 'Pending', bg: 'var(--primary-50)', color: 'var(--primary-700)' },
  completed: { label: 'Completed', bg: 'var(--green-50)', color: 'var(--green-600)' },
  cancelled: { label: 'Cancelled', bg: 'var(--red-50)', color: 'var(--red-600)' },
  missed: { label: 'Missed', bg: 'var(--red-50)', color: 'var(--red-600)' },
  taken: { label: 'Taken', bg: 'var(--green-50)', color: 'var(--green-600)' },
  skipped: { label: 'Skipped', bg: 'var(--gray-100)', color: 'var(--gray-600)' },
  draft: { label: 'Draft', bg: 'var(--gray-100)', color: 'var(--gray-600)' },
  paid: { label: 'Paid', bg: 'var(--green-50)', color: 'var(--green-600)' },
};

export default function StatusBadge({ status, label }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: 'var(--gray-100)', color: 'var(--gray-600)' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 'var(--radius-full, 9999px)',
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: '1.6',
      background: config.bg,
      color: config.color,
      textTransform: 'capitalize',
    }}>
      {label || config.label}
    </span>
  );
}
