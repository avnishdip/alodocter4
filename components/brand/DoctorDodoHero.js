"use client";

import Image from "next/image";

/**
 * Doctor Dodo — Hero pose. Uses the actual mascot photo with transparent background.
 * Used on the landing page.
 */
export default function DoctorDodoHero({ size = 320 }) {
  return (
    <Image
      src="/doctor-dodo-transparent.png"
      alt="Doctor Dodo mascot"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      priority
    />
  );
}
