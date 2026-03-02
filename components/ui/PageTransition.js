"use client";
import { motion } from "framer-motion";

const variants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.99 },
};

const transition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.4,
};

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      className={className}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
}
