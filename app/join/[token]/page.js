"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import styles from "./page.module.css";

export default function JoinPage({ params }) {
  const { token } = use(params);
  const router = useRouter();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function validateInvite() {
      try {
        const data = await api.get(`/auth/invite/${token}`);
        setInvite(data);
      } catch (err) {
        setError(err.message || "This invite link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    }
    validateInvite();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (pin !== confirmPin) {
      setSubmitError("PINs do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/auth/invite/${token}/accept`, { pin });
      useAuthStore.getState().setAuth(res.user, "patient", res.access_token);
      router.push("/patient/home");
    } catch (err) {
      setSubmitError(err.message || "Failed to accept invite. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.loadingText}>Validating invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Invalid Invite</h1>
            <p className={styles.errorMessage}>{error}</p>
          </div>
          <Link href="/login" className={styles.linkButton}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Alo Doctor</h1>
          <p className={styles.subtitle}>
            Dr. {invite.doctor_name} has invited you
          </p>
        </div>

        <div className={styles.info}>
          <p className={styles.infoItem}>
            <span className={styles.infoLabel}>Name</span>
            <span className={styles.infoValue}>{invite.patient_name}</span>
          </p>
          <p className={styles.infoItem}>
            <span className={styles.infoLabel}>Phone</span>
            <span className={styles.infoValue}>{invite.patient_phone}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.formHint}>
            Create a 6-digit PIN to secure your account.
          </p>
          <div className={styles.field}>
            <label className={styles.label}>PIN</label>
            <input
              type="password"
              className={styles.input}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="6-digit PIN"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Confirm PIN</label>
            <input
              type="password"
              className={styles.input}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm your PIN"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
            />
          </div>
          {submitError && <p className={styles.error}>{submitError}</p>}
          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? "Setting up your account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
