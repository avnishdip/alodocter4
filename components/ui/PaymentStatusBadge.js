"use client";

const config = {
  paid_cash: { label: 'Paid (Cash)', color: 'var(--green)', bg: 'var(--green-light)' },
  paid_juice: { label: 'Paid (Juice)', color: '#1565C0', bg: '#E3F2FD' },
  pending: { label: 'Pending', color: 'var(--star)', bg: '#FFF8E6' },
};

export default function PaymentStatusBadge({ status }) {
  const c = config[status] || config.pending;
  return (
    <span style={{
      padding: '6px 14px',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.78rem',
      fontWeight: 600,
      color: c.color,
      background: c.bg,
      display: 'inline-block',
    }}>
      {c.label}
    </span>
  );
}
