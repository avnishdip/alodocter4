"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      padding: "var(--space-12)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center"
    }}>
      <h2 style={{ fontSize: "var(--font-size-2xl)", color: "var(--text-primary)", marginBottom: "var(--space-4)" }}>
        Practice Dashboard Error
      </h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: "500px", marginBottom: "var(--space-8)" }}>
        There was an error loading the practice dashboard. Our team has been notified.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "var(--space-2) var(--space-6)",
          backgroundColor: "var(--primary)",
          color: "white",
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: "pointer"
        }}
      >
        Try again
      </button>
    </div>
  );
}
