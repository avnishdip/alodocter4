"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { api } from "@/lib/api";
import { CheckCircle, MinusCircle, Calendar, Clock } from "lucide-react";
import styles from "./page.module.css";

function formatTime(timeStr) {
  // timeStr like "08:00" or "08:00:00"
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [logsMap, setLogsMap] = useState({});
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loggedDoses, setLoggedDoses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingId, setLoggingId] = useState(null);

  const firstName = user?.first_name || user?.name?.split(" ")[0] || "there";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [plansData, appointmentsData, logsData] = await Promise.all([
        api.get("/medications/plans").catch(() => []),
        api.get("/appointments/").catch(() => []),
        api.get("/medications/logs").catch(() => [])
      ]);

      setPlans(Array.isArray(plansData) ? plansData : []);
      // Map today's logs so we can cross out taken meds
      const todayStr = new Date().toISOString().split("T")[0];
      const todayLogs = (Array.isArray(logsData) ? logsData : []).filter(l => l.scheduled_time && l.scheduled_time.startsWith(todayStr));
      const logMap = {};
      todayLogs.forEach(l => {
         // Assuming schedule format has the time
         const dt = new Date(l.scheduled_time);
         const hh = dt.getHours().toString().padStart(2, '0');
         const mm = dt.getMinutes().toString().padStart(2, '0');
         const timeKey = `${hh}:${mm}`;
         logMap[`${l.plan_id}-${timeKey}`] = l.status;
      });
      setLogsMap(logMap);

      // Find nearest upcoming appointment
      const now = new Date();
      const upcoming = (Array.isArray(appointmentsData) ? appointmentsData : [])
        .filter((a) => new Date(a.datetime) > now && a.status !== "cancelled")
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

      setNextAppointment(upcoming.length > 0 ? upcoming[0] : null);
    } catch (err) {
      console.error("Failed to load home data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build today's medication schedule from plans
  const todaysDoses = [];
  plans.forEach((plan) => {
    if (!plan.active && plan.active !== undefined) return;
    const times = plan.times || [];
    times.forEach((time) => {
      const doseKey = `${plan.id}_${time}`;
      todaysDoses.push({
        key: doseKey,
        planId: plan.id,
        medicationName: plan.medication_name,
        dosage: plan.dosage,
        time: time,
        status: loggedDoses[doseKey] || null,
      });
    });
  });

  // Sort by time
  todaysDoses.sort((a, b) => a.time.localeCompare(b.time));

  const allDone =
    todaysDoses.length > 0 &&
    todaysDoses.every((d) => d.status === "taken" || d.status === "skipped");

  const handleLog = async (dose, status) => {
    const doseKey = dose.key;
    setLoggingId(doseKey + status);

    try {
      // Build a scheduled_at datetime for today with the dose time
      const today = new Date();
      const [h, m] = dose.time.split(":");
      today.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      await api.post("/medications/logs", {
        plan_id: dose.planId,
        scheduled_at: today.toISOString(),
        status: status,
      });

      setLoggedDoses((prev) => ({ ...prev, [doseKey]: status }));
    } catch (err) {
      console.error("Failed to log medication:", err);
    } finally {
      setLoggingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.greeting}>Hi {firstName} 👋</h1>

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

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
         <button onClick={() => router.push('/patient/appointments/book')} style={{ flex: 1, padding: 'var(--space-4)', backgroundColor: 'var(--primary-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={18} /> Book Appointment
         </button>
         <button onClick={() => router.push('/patient/medications')} style={{ flex: 1, padding: 'var(--space-4)', backgroundColor: 'var(--blue-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <Clock size={18} /> Medication History
         </button>
      </div>

      {/* All meds done success banner */}
      {allDone && (
        <div className={styles.successBanner}>
          <CheckCircle size={28} color="var(--green-500)" />
          <div>
            <div className={styles.successText}>All done for today!</div>
            <div className={styles.successSub}>Great job staying on track.</div>
          </div>
        </div>
      )}

      {/* Today's Medications */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Today&apos;s Medications</h2>

        {todaysDoses.length === 0 ? (
          <div className={styles.emptyState}>
            No medications scheduled for today.
          </div>
        ) : (
          todaysDoses.map((dose) => (
            <div key={dose.key} className={styles.medItem} style={{ opacity: logsMap[dose.planId + '-' + dose.time] ? 0.5 : 1 }}>
              <div className={styles.medInfo}>
                <div className={styles.medTime}>
                  <Clock size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  {formatTime(dose.time)}
                </div>
                <div className={styles.medName}>{dose.medicationName}</div>
                <div className={styles.medDosage}>{dose.dosage}</div>
              </div>
              <div className={styles.medActions}>
                {dose.status === "taken" ? (
                  <span className={styles.statusTaken}>
                    <CheckCircle size={18} /> Taken
                  </span>
                ) : dose.status === "skipped" ? (
                  <span className={styles.statusSkipped}>
                    <MinusCircle size={18} /> Skipped
                  </span>
                ) : (
                  <>
                    <button
                      className={styles.btnTaken}
                      onClick={() => handleLog(dose, "taken")}
                      disabled={loggingId !== null}
                    >
                      Taken
                    </button>
                    <button
                      className={styles.btnSkip}
                      onClick={() => handleLog(dose, "skipped")}
                      disabled={loggingId !== null}
                    >
                      Skip
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Next Appointment */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Calendar size={18} style={{ marginRight: 6, verticalAlign: "middle" }} />
          Next Appointment
        </h2>

        {nextAppointment ? (
          <div className={styles.appointmentCard}>
            <div className={styles.appointmentDoctor}>
              {nextAppointment.doctor_name || "Your Doctor"}
            </div>
            <div className={styles.appointmentTime}>
              {formatDateTime(nextAppointment.datetime)}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>No upcoming appointments</div>
        )}
      </div>
    </div>
  );
}
