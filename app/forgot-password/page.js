"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import styles from "@/app/login/login.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Alo Doctor</h1>
          <p className={styles.subtitle}>Reset Your Password</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {success ? (
          <div>
            <p style={{ color: "var(--gray-700)", fontSize: "var(--text-sm)", textAlign: "center", marginBottom: "var(--space-6)" }}>
              Check your email for a password reset link.
            </p>
            <div className={styles.footer}>
              <Link href="/login" className={styles.link}>Back to Login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Work Email</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.name@clinic.mu"
                required
              />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className={styles.footer}>
              <Link href="/login" className={styles.link}>Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
