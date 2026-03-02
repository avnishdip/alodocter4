"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { api } from "@/lib/api";
import { User, Phone, CalendarDays, Edit3, LogOut } from "lucide-react";
import styles from "./page.module.css";

function formatDOB(dateStr) {
  if (!dateStr) return "Not set";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get("/patients/me");
      setProfile(data);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
    } catch (err) {
      console.error("Failed to load profile:", err);
      // Fall back to auth store user data
      if (user) {
        setProfile(user);
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const updated = await api.put("/patients/me", {
        first_name: firstName,
        last_name: lastName,
      });

      setProfile(updated);
      updateUser({ first_name: firstName, last_name: lastName });
      setEditing(false);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(profile?.first_name || "");
    setLastName(profile?.last_name || "");
    setEditing(false);
    setErrorMsg("");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const displayName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ") || "Patient";
  const initials =
    (profile?.first_name?.[0] || "") + (profile?.last_name?.[0] || "") || "P";
  const conditions = profile?.conditions || [];
  const phone = profile?.phone || profile?.phone_number || "";
  const dob = profile?.date_of_birth || profile?.dob || null;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Profile</h1>

      {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
      {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}

      {/* Avatar + name header */}
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>{initials.toUpperCase()}</div>
        <div>
          <div className={styles.avatarName}>{displayName}</div>
          {phone && <div className={styles.avatarPhone}>{phone}</div>}
        </div>
      </div>

      {/* Profile info card */}
      {!editing ? (
        <div className={styles.card}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>
              <User size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Name
            </span>
            <span className={styles.infoValue}>{displayName}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>
              <Phone size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Phone
            </span>
            <span className={styles.infoValue}>{phone || "Not set"}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>
              <CalendarDays size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Born
            </span>
            <span className={styles.infoValue}>{formatDOB(dob)}</span>
          </div>

          {conditions.length > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Conditions</span>
              <div className={styles.conditionsWrap}>
                {conditions.map((condition, idx) => (
                  <span key={idx} className={styles.tag}>
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Edit form */
        <div className={styles.card}>
          <div className={styles.cardTitle}>Edit Profile</div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className={styles.input}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className={styles.input}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.btnCancel}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className={styles.btnSave}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Edit button (shown when not editing) */}
      {!editing && (
        <button className={styles.btnEdit} onClick={() => setEditing(true)}>
          <Edit3 size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
          Edit Profile
        </button>
      )}

      {/* Logout */}
      <button
        className={styles.btnLogout}
        onClick={handleLogout}
        style={{ marginTop: "var(--space-4)" }}
      >
        <LogOut size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
        Log Out
      </button>
    </div>
  );
}
