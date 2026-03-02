"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      padding: "var(--space-8)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      height: "80vh"
    }}>
      <h2 style={{ fontSize: "var(--font-size-xl)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
        Oops! Something went wrong
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
        We encountered an error loading your patient portal.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "var(--space-2) var(--space-4)",
          backgroundColor: "var(--primary)",
          color: "white",
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: "pointer",
          width: "100%",
          maxWidth: "200px"
        }}
      >
        Try again
      </button>
    </div>
  );
}
