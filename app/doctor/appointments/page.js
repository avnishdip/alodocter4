"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonRow } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isPast(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function AppointmentsPage() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Notes modal
  const [notesApt, setNotesApt] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [appointmentsData, patientsData] = await Promise.all([
        api.get("/appointments/"),
        api.get("/patients/"),
      ]);
      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
    } catch (err) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const patientMap = useMemo(() => {
    return Object.fromEntries(
      patients.map((p) => [p.id, `${p.first_name} ${p.last_name}`])
    );
  }, [patients]);

  const filtered = useMemo(() => {
    return appointments.filter((apt) => {
      if (activeTab === "upcoming") {
        return (
          apt.status !== "cancelled" &&
          apt.status !== "completed" &&
          !isPast(apt.datetime)
        );
      }
      // past tab: completed, cancelled, or past date
      return (
        apt.status === "completed" ||
        apt.status === "cancelled" ||
        isPast(apt.datetime)
      );
    });
  }, [appointments, activeTab]);

  async function markCompleted(apt) {
    try {
      await api.patch(`/appointments/${apt.id}`, { status: "completed" });
      toast("Appointment marked as completed");
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to update appointment", "error");
    }
  }

  async function cancelAppointment(apt) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.patch(`/appointments/${apt.id}`, { status: "cancelled" });
      toast("Appointment cancelled", "warning");
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to cancel appointment", "error");
    }
  }

  function openNotes(apt) {
    setNotesApt(apt);
    setNotesText(apt.notes || "");
  }

  async function saveNotes(e) {
    e.preventDefault();
    try {
      setNotesLoading(true);
      await api.patch(`/appointments/${notesApt.id}`, { notes: notesText });
      setNotesApt(null);
      toast("Notes saved successfully");
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to save notes", "error");
    } finally {
      setNotesLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Appointments</h1>
        </div>
        <div className={styles.card}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} columns={6} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Appointments</h1>
      </div>

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
          <button onClick={() => { setError(null); fetchData(); }} style={{
            background: 'var(--red-600)',
            color: 'white',
            border: 'none',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}>Retry</button>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "upcoming" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "past" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("past")}
        >
          Past
        </button>
      </div>

      <div className={styles.card}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Calendar size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>
              {activeTab === "upcoming"
                ? "No upcoming appointments."
                : "No past appointments."}
            </div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => (
                <tr key={apt.id}>
                  <td style={{ fontWeight: "var(--font-medium)" }}>
                    {patientMap[apt.patient_id] || `Patient #${apt.patient_id}`}
                    {apt.notes && <span style={{ display: 'inline-block', marginLeft: '8px', padding: '2px 6px', background: 'var(--amber-100)', color: 'var(--amber-800)', borderRadius: '4px', fontSize: '0.7em', fontWeight: 'bold' }}>HAS NOTES</span>}
                  </td>
                  <td>{formatDate(apt.datetime)}</td>
                  <td>{formatTime(apt.datetime)}</td>
                  <td>{(apt.type || "clinic_visit").replace(/_/g, " ")}</td>
                  <td>
                    <StatusBadge status={apt.status || "booked"} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {apt.status !== "completed" &&
                        apt.status !== "cancelled" && (
                          <>
                            <button
                              className={styles.btnAction}
                              onClick={() => markCompleted(apt)}
                              title="Mark as completed"
                            >
                              <CheckCircle2 size={14} />
                              Done
                            </button>
                            <button
                              className={styles.btnActionDanger}
                              onClick={() => cancelAppointment(apt)}
                              title="Cancel"
                            >
                              <XCircle size={14} />
                              Cancel
                            </button>
                          </>
                        )}
                      <button
                        className={styles.btnAction}
                        onClick={() => openNotes(apt)}
                        title="Add notes"
                      >
                        <FileText size={14} />
                        Notes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes modal */}
      {notesApt && (
        <div className={styles.overlay} onClick={() => setNotesApt(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Appointment Notes</h2>
            <form className={styles.form} onSubmit={saveNotes}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Notes for {patientMap[notesApt.patient_id] || `Patient #${notesApt.patient_id}`}
                </label>
                <textarea
                  className={styles.textarea}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Write appointment notes here..."
                />
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setNotesApt(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={notesLoading}
                >
                  {notesLoading ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
