"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  
  const { loginDoctor, requestOTP, verifyOTP } = useAuthStore();
  const [activeTab, setActiveTab] = useState("doctor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);

  // Safely extract search params after hydration to avoid Next.js Suspense issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");
      if (redirect) {
        setRedirectUrl(redirect);
        if (redirect.includes("patient")) {
          setActiveTab("patient");
        }
      }
    }
  }, []);

  // Doctor form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Patient form
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginDoctor(email, password);
      router.push(redirectUrl || "/doctor/dashboard");
    } catch (err) {
      if (err.message?.includes("Profile incomplete")) {
        router.push("/onboarding");
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestOTP(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOTP(phone, otp);
      router.push(redirectUrl || "/patient/home");
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Alo Doctor</h1>
          <p className={styles.subtitle}>Secure Access Portal</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "doctor" ? styles.tabActive : ""}`}
            onClick={() => { setActiveTab("doctor"); setError(""); }}
          >
            Healthcare Provider
          </button>
          <button
            className={`${styles.tab} ${activeTab === "patient" ? styles.tabActive : ""}`}
            onClick={() => { setActiveTab("patient"); setError(""); }}
          >
            Patient Access
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {activeTab === "doctor" ? (
          <form onSubmit={handleDoctorLogin} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Work Email</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.name@clinic.mu"
                aria-label="Work Email"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure password"
                aria-label="Password"
                required
              />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </button>
          </form>
        ) : (
          !otpSent ? (
            <form onSubmit={handleRequestOTP} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="5XXX XXXX"
                  aria-label="Phone Number"
                  required
                />
              </div>
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? "Sending Code..." : "Send Login Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Enter Code sent to {phone}</label>
                <input
                  type="text"
                  className={styles.input}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  aria-label="Verification Code"
                  required
                />
              </div>
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
            </form>
          )
        )}

        <div className={styles.footer}>
          {activeTab === "doctor" && (
            <p style={{ marginBottom: "var(--space-3)" }}>
              <Link href="/forgot-password" className={styles.link}>Forgot password?</Link>
            </p>
          )}
          <p>
            New practitioner?{" "}
            <Link href="/onboarding" className={styles.link}>Request Platform Access</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
