"use client";
import { motion } from "framer-motion";

export default function TimeSlotPicker({ slots, selectedIndex, onSelect, compact = false }) {
  return (
    <div className={compact ? "time-row" : "time-slots"}>
      {slots.map((slot, i) => {
        const time = typeof slot === 'string' ? slot : slot.time;
        const available = typeof slot === 'object' ? slot.available !== false : true;
        const isSelected = selectedIndex === i;

        return (
          <motion.button
            key={time}
            className={`${compact ? "mini-time" : "time-btn"} ${isSelected ? "active" : ""}`}
            onClick={() => available && onSelect(i)}
            whileTap={{ scale: 0.95 }}
            disabled={!available}
            style={!available ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            {time}
          </motion.button>
        );
      })}
    </div>
  );
}
