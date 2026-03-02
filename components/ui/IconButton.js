"use client";
import { motion } from "framer-motion";

export default function IconButton({ icon: Icon, size = 20, onClick, className = '', badge }) {
  return (
    <motion.button
      className={`icon-btn ${className}`}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
    >
      <Icon size={size} />
      {badge && <span className="notif-dot" />}
    </motion.button>
  );
}
