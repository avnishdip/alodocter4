"use client";

import { useEffect } from "react";
import styles from "./landing.module.css";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.container} style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <h2 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-4)" }}>Something went wrong!</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-8)" }}>
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "var(--space-3) var(--space-6)",
          backgroundColor: "var(--primary)",
          color: "white",
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: "pointer",
          fontWeight: "var(--font-semibold)"
        }}
      >
        Try again
      </button>
    </div>
  );
}
