"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Search, UserPlus, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { SkeletonRow } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    conditions: "",
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function fetchPatients() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get("/patients/");
      setPatients(data || []);
    } catch (err) {
      setError(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        (p.first_name && p.first_name.toLowerCase().includes(q)) ||
        (p.last_name && p.last_name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [patients, search]);

  async function handleInvite(e) {
    e.preventDefault();
    try {
      setInviteLoading(true);
      setInviteError(null);

      const payload = {
        first_name: inviteForm.first_name.trim(),
        last_name: inviteForm.last_name.trim(),
        phone: inviteForm.phone.trim(),
        conditions: inviteForm.conditions
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      };

      const res = await api.post("/patients/invite", payload);
      setInviteLink(res.invite_link || "");
      await fetchPatients();
    } catch (err) {
      setInviteError(err.message || "Failed to invite patient");
    } finally {
      setInviteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Patients</h1>
        </div>
        <div className={styles.card}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} columns={4} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {error && (
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--red-50)',
          color: 'var(--red-600)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button onClick={() => { setError(null); fetchPatients(); }} style={{
            background: 'var(--red-600)',
            color: 'white',
            border: 'none',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}>Retry</button>
        </div>
      )}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Patients</h1>
        <div className={styles.headerActions}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => setShowInvite(true)}
          >
            <UserPlus size={16} />
            Invite Patient
          </button>
        </div>
      </div>

      <div className={styles.card}>
        {filteredPatients.length === 0 ? (
          <div className={styles.empty}>
            <Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>
              {search
                ? "No patients match your search."
                : "No patients yet. Invite your first patient to get started."}
            </div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Conditions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <Link
                      href={`/doctor/patients/${patient.id}`}
                      className={styles.patientLink}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                    >
                      <Avatar
                        initials={`${(patient.first_name || '')[0] || ''}${(patient.last_name || '')[0] || ''}`}
                        size={28}
                        rounded={14}
                      />
                      {patient.first_name} {patient.last_name}
                    </Link>
                  </td>
                  <td>{patient.phone || "—"}</td>
                  <td>
                    <div className={styles.conditionTags}>
                      {(patient.conditions || []).map((c, i) => (
                        <span key={i} className={styles.conditionTag}>
                          {c}
                        </span>
                      ))}
                      {(!patient.conditions || patient.conditions.length === 0) && "—"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        patient.status === "active"
                          ? styles.badgeActive
                          : styles.badgeInvited
                      }`}
                    >
                      {patient.status || "invited"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && (
        <div className={styles.overlay} onClick={() => { setShowInvite(false); setInviteLink(""); setCopied(false); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {inviteLink ? (
              <>
                <h2 className={styles.modalTitle}>Invite Sent</h2>
                <p className={styles.inviteMessage}>
                  Share this link with your patient so they can create their account:
                </p>
                <div className={styles.inviteLinkRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={inviteLink}
                    readOnly
                  />
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => {
                      setShowInvite(false);
                      setInviteLink("");
                      setCopied(false);
                      setInviteForm({ first_name: "", last_name: "", phone: "", conditions: "" });
                    }}
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.modalTitle}>Invite Patient</h2>
                <form className={styles.form} onSubmit={handleInvite}>
                  <div className={styles.field}>
                    <label className={styles.label}>First Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={inviteForm.first_name}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, first_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Last Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={inviteForm.last_name}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, last_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Phone</label>
                    <input
                      type="tel"
                      className={styles.input}
                      placeholder="+230 5XXX XXXX"
                      value={inviteForm.phone}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Conditions (comma-separated)</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Diabetes, Hypertension"
                      value={inviteForm.conditions}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, conditions: e.target.value })
                      }
                    />
                  </div>
                  {inviteError && <p className={styles.formError}>{inviteError}</p>}
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setShowInvite(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                      disabled={inviteLoading}
                    >
                      {inviteLoading ? "Sending..." : "Send Invite"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
