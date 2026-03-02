"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { api } from "@/lib/api";
import { Save, LogOut, CheckCircle2 } from "lucide-react";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { logout, updateUser } = useAuthStore();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    specialty: "",
    bio: "",
    fee: "",
    phone: "",
    is_public: false,
    clinic_name: "",
    clinic_address: "",
    brn_number: "",
    invoice_notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get("/doctors/me");
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          specialty: data.specialty || "",
          bio: data.bio || "",
          fee: data.fee ?? "",
          phone: data.phone || "",
          is_public: data.is_public || false,
          clinic_name: data.clinic_name || "",
          clinic_address: data.clinic_address || "",
          brn_number: data.brn_number || "",
          invoice_notes: data.invoice_notes || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setFormError(null);
      setSaved(false);

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        specialty: form.specialty.trim(),
        bio: form.bio.trim(),
        fee: form.fee
          ? parseFloat(form.fee)
          : null,
        phone: form.phone.trim(),
        is_public: form.is_public,
        clinic_name: form.clinic_name.trim(),
        clinic_address: form.clinic_address.trim(),
        brn_number: form.brn_number.trim(),
        invoice_notes: form.invoice_notes.trim(),
      };

      const updated = await api.put("/doctors/me", payload);

      // Update auth store with new name
      updateUser({
        first_name: payload.first_name,
        last_name: payload.last_name,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setFormError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (loading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Profile</h1>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>First Name</label>
              <input
                type="text"
                className={styles.input}
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Last Name</label>
              <input
                type="text"
                className={styles.input}
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Specialty</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. General Practitioner, Cardiologist"
              value={form.specialty}
              onChange={(e) =>
                setForm({ ...form, specialty: e.target.value })
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Bio</label>
            <textarea
              className={styles.textarea}
              placeholder="Tell patients about yourself, your experience, and your approach to care..."
              value={form.bio}
              onChange={(e) =>
                setForm({ ...form, bio: e.target.value })
              }
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Consultation Fee (MUR)</label>
              <input
                type="number"
                className={styles.input}
                placeholder="0"
                min="0"
                step="0.01"
                value={form.fee}
                onChange={(e) =>
                  setForm({ ...form, fee: e.target.value })
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone</label>
              <input
                type="tel"
                className={styles.input}
                placeholder="+230 5XXX XXXX"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.field} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-4)", padding: "var(--space-4)", backgroundColor: "var(--primary-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--primary-100)" }}>
            <input
              type="checkbox"
              id="is_public"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              style={{ width: "18px", height: "18px", accentColor: "var(--primary-600)", cursor: "pointer" }}
            />
            <div>
              <label htmlFor="is_public" style={{ fontWeight: "var(--font-semibold)", color: "var(--gray-900)", cursor: "pointer", display: "block" }}>
                Make Profile Public (Marketplace)
              </label>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--gray-500)", display: "block", marginTop: "2px" }}>
                Allow new patients to find you and book appointments directly.
              </span>
            </div>
          </div>

          <div style={{ marginTop: "var(--space-8)", marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", color: "var(--gray-900)", marginBottom: "var(--space-2)" }}>Billing & Invoice Settings</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--gray-500)" }}>Customize how your practice appears on generated invoices.</p>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Clinic Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. HealthFirst Clinic"
                value={form.clinic_name}
                onChange={(e) =>
                  setForm({ ...form, clinic_name: e.target.value })
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>BRN / VAT Number</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. C12345678"
                value={form.brn_number}
                onChange={(e) =>
                  setForm({ ...form, brn_number: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Clinic Address</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. 123 Royal Road, Port Louis"
              value={form.clinic_address}
              onChange={(e) =>
                setForm({ ...form, clinic_address: e.target.value })
              }
              style={{ minHeight: "80px" }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Invoice Notes / Payment Terms</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Payment due via Juice. Thanks for choosing us."
              value={form.invoice_notes}
              onChange={(e) =>
                setForm({ ...form, invoice_notes: e.target.value })
              }
              style={{ minHeight: "80px" }}
            />
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.divider} />

          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && (
                <span className={styles.successMsg}>
                  <CheckCircle2 size={16} />
                  Profile saved
                </span>
              )}
            </div>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
