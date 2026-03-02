"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { api } from "@/lib/api";
import styles from "./onboarding.module.css";

const SPECIALTIES = [
  "General Practitioner",
  "Cardiologist",
  "Endocrinologist",
  "Neurologist",
  "Pediatrician",
  "Dermatologist",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function OnboardingPage() {
  const router = useRouter();
  const { registerDoctor, loginDoctor } = useAuthStore();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [licenseNo, setLicenseNo] = useState("");

  // Step 2: Practice
  const [bio, setBio] = useState("");
  const [fee, setFee] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3: Availability
  const [availability, setAvailability] = useState(
    DAYS.map((_, i) => ({
      enabled: i < 5,
      startTime: "09:00",
      endTime: "16:00",
      slotDuration: 30,
    }))
  );

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerDoctor({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        specialty,
        license_no: licenseNo,
      });
      setStep(2);
    } catch (err) {
      if (err.message?.includes("verify your email")) {
         setError("Success! Please check your email and click the verification link. Once verified, come back here and click 'Continue' again.");
      } else if (err.message?.includes("already registered") || err.message?.includes("User already exists")) {
         // If they already signed up but didn't finish onboarding, try to log them in and push to step 2
         try {
             await loginDoctor(email, password);
             setStep(2);
             setError("");
         } catch (loginErr) {
             setError(loginErr.message || "Registration failed. Try logging in directly.");
         }
      } else {
         setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.put("/doctors/me", {
        bio,
        fee: fee !== "" ? parseInt(fee, 10) || 0 : 0,
        phone,
      });
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvailability = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const slots = availability
        .map((day, i) => ({
          day_of_week: i,
          start_time: day.startTime,
          end_time: day.endTime,
          slot_duration: day.slotDuration,
          enabled: day.enabled,
        }))
        .filter((s) => s.enabled);

      await api.put("/doctors/me/availability", slots);
      router.push("/doctor/dashboard");
    } catch (err) {
      setError(err.message || "Failed to save availability");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (index) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, enabled: !day.enabled } : day))
    );
  };

  const updateDay = (index, field, value) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Alo Doctor</h1>
          <p className={styles.subtitle}>Set up your practice</p>
        </div>

        <div className={styles.steps}>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`${styles.step} ${step >= s ? styles.stepActive : ""}`}>
              {s}
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleRegister} className={styles.form}>
            <h2 className={styles.stepTitle}>Create your account</h2>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>First name</label>
                <input className={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Last name</label>
                <input className={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Specialty</label>
              <select className={styles.input} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Medical license number</label>
              <input className={styles.input} value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="MC-YYYY-XXX" required />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Creating account..." : "Continue"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleProfile} className={styles.form}>
            <h2 className={styles.stepTitle}>Practice details</h2>
            <div className={styles.field}>
              <label className={styles.label}>Bio</label>
              <textarea className={`${styles.input} ${styles.textarea}`} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell patients about your experience..." />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Consultation fee (MUR)</label>
              <input type="number" className={styles.input} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="1500" min="0" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone number</label>
              <input type="tel" className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+230 5XXX XXXX" />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleAvailability} className={styles.form}>
            <h2 className={styles.stepTitle}>Set your availability</h2>
            <div className={styles.availabilityList}>
              {DAYS.map((day, i) => (
                <div key={day} className={styles.dayRow}>
                  <label className={styles.dayToggle}>
                    <input
                      type="checkbox"
                      checked={availability[i].enabled}
                      onChange={() => toggleDay(i)}
                    />
                    <span className={styles.dayName}>{day}</span>
                  </label>
                  {availability[i].enabled && (
                    <div className={styles.timeInputs}>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={availability[i].startTime}
                        onChange={(e) => updateDay(i, "startTime", e.target.value)}
                      />
                      <span className={styles.timeSeparator}>to</span>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={availability[i].endTime}
                        onChange={(e) => updateDay(i, "endTime", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Saving..." : "Complete setup"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
