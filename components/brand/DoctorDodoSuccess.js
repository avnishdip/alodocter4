"use client";

import Image from "next/image";

/**
 * Doctor Dodo — Success pose. Uses the actual mascot photo.
 * Used when patient logs all meds, completes actions, etc.
 */
export default function DoctorDodoSuccess({ size = 120 }) {
  return (
    <Image
      src="/doctor-dodo.jpg"
      alt="Doctor Dodo mascot"
      width={size}
      height={size}
      style={{ borderRadius: "16px" }}
    />
  );
}
