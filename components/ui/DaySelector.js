"use client";
import { motion } from "framer-motion";

export default function DaySelector({ days, selectedIndex, onSelect, compact = false }) {
  if (compact) {
    return (
      <div className="day-row">
        {days.map((d, i) => (
          <motion.button
            key={d.date || i}
            className={`mini-day ${selectedIndex === i ? "active" : ""}`}
            onClick={() => onSelect(i)}
            whileTap={{ scale: 0.92 }}
          >
            <span className="mini-day-label">{d.day}</span>
            <span className="mini-day-num">{d.dayNum || d.date}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="day-selector">
      {days.map((d, i) => (
        <motion.button
          key={d.date || i}
          className={`day-btn ${selectedIndex === i ? "active" : ""}`}
          onClick={() => onSelect(i)}
          whileTap={{ scale: 0.92 }}
        >
          <span className="day-label">{d.day}</span>
          <span className="day-date">{d.dayNum || d.date}</span>
        </motion.button>
      ))}
    </div>
  );
}
