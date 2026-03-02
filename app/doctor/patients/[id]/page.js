"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Phone,
  Pill,
  CalendarDays,
  Plus,
  Activity,
  Flame,
  CheckCircle2,
  XCircle,
  SkipForward,
} from "lucide-react";
import styles from "./page.module.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
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

export default function PatientDetailPage({ params }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;

  const [patient, setPatient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add plan modal
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [planForm, setPlanForm] = useState({
    medication_name: "",
    dosage: "",
    frequency: "once_daily",
    times: ["08:00"],
    start_date: new Date().toISOString().split("T")[0],
  });
  const [planFormLoading, setPlanFormLoading] = useState(false);
  const [planFormError, setPlanFormError] = useState(null);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      const [patientData, plansData, complianceData, appointmentsData] =
        await Promise.allSettled([
          api.get(`/patients/${patientId}`),
          api.get(`/medications/plans/patient/${patientId}`),
          api.get(`/medications/compliance/${patientId}`),
          api.get("/appointments/"),
        ]);

      if (patientData.status === "fulfilled") {
        setPatient(patientData.value);
      } else {
        throw new Error("Patient not found");
      }

      setPlans(
        plansData.status === "fulfilled" ? plansData.value || [] : []
      );
      setCompliance(
        complianceData.status === "fulfilled" ? complianceData.value : null
      );

      // Filter appointments by this patient
      const allApts =
        appointmentsData.status === "fulfilled"
          ? appointmentsData.value || []
          : [];
      setAppointments(
        allApts.filter(
          (a) => String(a.patient_id) === String(patientId)
        )
      );
    } catch (err) {
      setError(err.message || "Failed to load patient data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  function addTimeSlot() {
    setPlanForm({ ...planForm, times: [...planForm.times, "12:00"] });
  }

  function updateTimeSlot(index, value) {
    const updated = [...planForm.times];
    updated[index] = value;
    setPlanForm({ ...planForm, times: updated });
  }

  function removeTimeSlot(index) {
    if (planForm.times.length <= 1) return;
    setPlanForm({
      ...planForm,
      times: planForm.times.filter((_, i) => i !== index),
    });
  }

  async function handleAddPlan(e) {
    e.preventDefault();
    try {
      setPlanFormLoading(true);
      setPlanFormError(null);
      await api.post("/medications/plans", {
        patient_id: patientId,
        medication_name: planForm.medication_name.trim(),
        dosage: planForm.dosage.trim(),
        frequency: planForm.frequency,
        times: planForm.times,
        start_date: planForm.start_date,
      });
      setShowAddPlan(false);
      setPlanForm({
        medication_name: "",
        dosage: "",
        frequency: "once_daily",
        times: ["08:00"],
        start_date: new Date().toISOString().split("T")[0],
      });
      await fetchAll();
    } catch (err) {
      setPlanFormError(err.message || "Failed to create medication plan");
    } finally {
      setPlanFormLoading(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading patient details...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!patient) {
    return <div className={styles.error}>Patient not found.</div>;
  }

  return (
    <div className={styles.page}>
      <Link href="/doctor/patients" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Patients
      </Link>

      {/* Patient header */}
      <div className={styles.patientHeader}>
        <div className={styles.patientInfo}>
          <h1 className={styles.patientName}>
            {patient.first_name} {patient.last_name}
          </h1>
          <div className={styles.patientMeta}>
            {patient.phone && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Phone size={14} /> {patient.phone}
              </span>
            )}
            <span
              className={`${styles.badge} ${
                patient.status === "active"
                  ? styles.badgeActive
                  : styles.badgeInvited
              }`}
            >
              {patient.status || "invited"}
            </span>
          </div>
          {patient.conditions && patient.conditions.length > 0 && (
            <div className={styles.conditionTags}>
              {patient.conditions.map((c, i) => (
                <span key={i} className={styles.conditionTag}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
           <button onClick={() => setShowAddPlan(true)} style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--primary-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Pill size={16} /> Prescribe
           </button>
           <button onClick={() => window.location.href=`/doctor/appointments`} style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--blue-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CalendarDays size={16} /> Book Appt
           </button>
        </div>
      </div>

      {/* Compliance stats */}
      <div className={styles.complianceStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            <Activity size={18} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {compliance ? `${compliance.adherence_percentage}%` : "—"}
          </div>
          <div className={styles.statLabel}>Adherence</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            <Flame size={18} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {compliance ? compliance.current_streak || 0 : "—"}
          </div>
          <div className={styles.statLabel}>Day Streak</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            <CheckCircle2
              size={18}
              style={{ verticalAlign: "middle", marginRight: 4, color: "var(--green-500)" }}
            />
            {compliance ? compliance.taken_count || 0 : "—"}
          </div>
          <div className={styles.statLabel}>Taken</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            <XCircle
              size={18}
              style={{ verticalAlign: "middle", marginRight: 4, color: "var(--red-500)" }}
            />
            {compliance ? compliance.missed_count || 0 : "—"}
          </div>
          <div className={styles.statLabel}>Missed</div>
        </div>
      </div>

      {/* Sections */}
      <div className={styles.sections}>
        {/* Medication plans */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Pill size={18} />
              Medication Plans
            </div>
            <button
              className={styles.btnSmall}
              onClick={() => setShowAddPlan(true)}
            >
              <Plus size={14} />
              Add Plan
            </button>
          </div>
          {plans.length === 0 ? (
            <div className={styles.empty}>
              No medication plans yet.
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className={styles.planItem}>
                <div className={styles.planName}>
                  {plan.medication_name}
                  <span
                    className={`${styles.badge} ${
                      plan.active !== false
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }`}
                    style={{ marginLeft: 8 }}
                  >
                    {plan.active !== false ? "active" : "inactive"}
                  </span>
                </div>
                <div className={styles.planDetails}>
                  {plan.dosage} &middot; {plan.frequency?.replace(/_/g, " ")} &middot;{" "}
                  {(plan.times || []).join(", ")}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Appointments */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <CalendarDays size={18} />
              Appointments
            </div>
          </div>
          {appointments.length === 0 ? (
            <div className={styles.empty}>No appointments found.</div>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} className={styles.appointmentItem}>
                <div>
                  <div className={styles.appointmentDate}>
                    {formatDate(apt.datetime)}
                  </div>
                  <div className={styles.appointmentTime}>
                    {formatTime(apt.datetime)}
                  </div>
                </div>
                <span
                  className={`${styles.badge} ${
                    apt.status === "completed"
                      ? styles.badgeCompleted
                      : apt.status === "cancelled"
                      ? styles.badgeCancelled
                      : styles.badgeBooked
                  }`}
                >
                  {apt.status || "booked"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Plan Modal */}
      {showAddPlan && (
        <div className={styles.overlay} onClick={() => setShowAddPlan(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add Medication Plan</h2>
            <form className={styles.form} onSubmit={handleAddPlan}>
              <div className={styles.field}>
                <label className={styles.label}>Medication Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={planForm.medication_name}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, medication_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Dosage</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 500mg"
                  value={planForm.dosage}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, dosage: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Frequency</label>
                <select
                  className={styles.select}
                  value={planForm.frequency}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, frequency: e.target.value })
                  }
                >
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="three_daily">Three Times Daily</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Times</label>
                <div className={styles.timesRow}>
                  {planForm.times.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="time"
                        className={styles.input}
                        value={t}
                        onChange={(e) => updateTimeSlot(i, e.target.value)}
                        style={{ width: 120 }}
                      />
                      {planForm.times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(i)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--red-500)",
                            cursor: "pointer",
                            fontSize: "var(--text-sm)",
                          }}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.btnAddTime}
                    onClick={addTimeSlot}
                  >
                    + Add Time
                  </button>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Start Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={planForm.start_date}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, start_date: e.target.value })
                  }
                  required
                />
              </div>
              {planFormError && (
                <p className={styles.formError}>{planFormError}</p>
              )}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowAddPlan(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={planFormLoading}
                >
                  {planFormLoading ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
