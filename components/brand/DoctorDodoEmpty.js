"use client";

import Image from "next/image";

/**
 * Doctor Dodo — Empty state pose. Uses the actual mascot photo with reduced opacity.
 * Used when there's no data to show (no appointments, no patients, etc.)
 */
export default function DoctorDodoEmpty({ size = 160 }) {
  return (
    <Image
      src="/doctor-dodo.jpg"
      alt="Doctor Dodo mascot"
      width={size}
      height={size}
      style={{ borderRadius: "16px", opacity: 0.7 }}
    />
  );
}
