"use client";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton({ onClick }) {
  const router = useRouter();

  const handleClick = onClick || (() => router.back());

  return (
    <motion.button className="back-btn" onClick={handleClick} whileTap={{ scale: 0.9 }}>
      <ArrowLeft size={22} />
    </motion.button>
  );
}
