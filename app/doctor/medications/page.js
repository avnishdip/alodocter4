"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Pill, Plus, Edit2, Power } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import styles from "./page.module.css";

export default function MedicationsPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({
    patient_id: "",
    medication_name: "",
    dosage: "",
    frequency: "once_daily",
    times: ["08:00"],
    start_date: new Date().toISOString().split("T")[0],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [plansData, patientsData] = await Promise.all([
        api.get("/medications/plans"),
        api.get("/patients/"),
      ]);
      setPlans(plansData || []);
      setPatients(patientsData || []);
    } catch (err) {
      setError(err.message || "Failed to load medication plans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function getPatientName(patientId) {
    const p = patients.find((pt) => String(pt.id) === String(patientId));
    return p ? `${p.first_name} ${p.last_name}` : `Patient #${patientId}`;
  }

  function openCreate() {
    setEditingPlan(null);
    setForm({
      patient_id: patients.length > 0 ? patients[0].id : "",
      medication_name: "",
      dosage: "",
      frequency: "once_daily",
      times: ["08:00"],
      start_date: new Date().toISOString().split("T")[0],
    });
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(plan) {
    setEditingPlan(plan);
    setForm({
      patient_id: plan.patient_id,
      medication_name: plan.medication_name || "",
      dosage: plan.dosage || "",
      frequency: plan.frequency || "once_daily",
      times: plan.times || ["08:00"],
      start_date: plan.start_date || new Date().toISOString().split("T")[0],
    });
    setFormError(null);
    setShowModal(true);
  }

  function addTimeSlot() {
    setForm({ ...form, times: [...form.times, "12:00"] });
  }

  function updateTimeSlot(index, value) {
    const updated = [...form.times];
    updated[index] = value;
    setForm({ ...form, times: updated });
  }

  function removeTimeSlot(index) {
    if (form.times.length <= 1) return;
    setForm({ ...form, times: form.times.filter((_, i) => i !== index) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        patient_id: form.patient_id,
        medication_name: form.medication_name.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        times: form.times,
        start_date: form.start_date,
      };

      if (editingPlan) {
        await api.patch(`/medications/plans/${editingPlan.id}`, payload);
        toast("Medication plan updated");
      } else {
        await api.post("/medications/plans", payload);
        toast("Medication plan created");
      }

      setShowModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err.message || "Failed to save medication plan");
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleActive(plan) {
    try {
      await api.patch(`/medications/plans/${plan.id}`, {
        active: plan.active === false ? true : false,
      });
      toast(`Plan ${plan.active === false ? "activated" : "deactivated"}`);
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to update plan status", "error");
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading medication plans...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Medications</h1>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <Plus size={16} />
          Create Plan
        </button>
      </div>

      <div className={styles.card}>
        {plans.length === 0 ? (
          <div className={styles.empty}>
            <Pill size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>No medication plans yet. Create one to get started.</div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Times</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>{getPatientName(plan.patient_id)}</td>
                  <td style={{ fontWeight: "var(--font-medium)" }}>
                    {plan.medication_name}
                  </td>
                  <td>{plan.dosage || "—"}</td>
                  <td>{(plan.frequency || "").replace(/_/g, " ")}</td>
                  <td>{(plan.times || []).join(", ") || "—"}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        plan.active !== false
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {plan.active !== false ? "active" : "inactive"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnAction}
                        onClick={() => openEdit(plan)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={styles.btnActionDanger}
                        onClick={() => toggleActive(plan)}
                        title={
                          plan.active !== false ? "Deactivate" : "Activate"
                        }
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingPlan ? "Edit Medication Plan" : "Create Medication Plan"}
            </h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Patient</label>
                <select
                  className={styles.select}
                  value={form.patient_id}
                  onChange={(e) =>
                    setForm({ ...form, patient_id: e.target.value })
                  }
                  disabled={!!editingPlan}
                  required
                >
                  <option value="">Select a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Medication Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.medication_name}
                  onChange={(e) =>
                    setForm({ ...form, medication_name: e.target.value })
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
                  value={form.dosage}
                  onChange={(e) =>
                    setForm({ ...form, dosage: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Frequency</label>
                <select
                  className={styles.select}
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({ ...form, frequency: e.target.value })
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
                  {form.times.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                      }}
                    >
                      <input
                        type="time"
                        className={styles.input}
                        value={t}
                        onChange={(e) => updateTimeSlot(i, e.target.value)}
                        style={{ flex: 1, maxWidth: "160px" }}
                      />
                      {form.times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(i)}
                          style={{
                            background: "var(--red-50)",
                            border: "none",
                            color: "var(--red-600)",
                            cursor: "pointer",
                            fontSize: "var(--text-lg)",
                            width: "36px",
                            height: "36px",
                            borderRadius: "var(--radius-md)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
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
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  required
                />
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : editingPlan
                    ? "Update Plan"
                    : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
