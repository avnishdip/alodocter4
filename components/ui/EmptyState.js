"use client";
import { motion } from "framer-motion";

export default function EmptyState({ title, description, action, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: 'center',
        padding: '60px 24px',
      }}
    >
      <img
        src="/doctor-dodo.jpg"
        alt="Doctor Dodo"
        style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 20, marginBottom: 24, opacity: 0.8 }}
      />
      <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--font-bold)', fontSize: '1.3rem', color: 'var(--gray-900)', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>
        {description}
      </p>
      {action && (
        <motion.button
          onClick={onAction}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '12px 28px',
            background: 'var(--gray-900)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {action}
        </motion.button>
      )}
    </motion.div>
  );
}
