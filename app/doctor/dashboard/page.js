"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { api } from "@/lib/api";
import { Users, CalendarDays, Activity, AlertTriangle, Clock, DollarSign } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatCurrency(amount) {
  return `MUR ${Number(amount).toLocaleString("en-MU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [complianceAlerts, setComplianceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const [patientsData, appointmentsData, invoicesData] = await Promise.all([
        api.get("/patients/"),
        api.get("/appointments/"),
        api.get("/invoices/"),
      ]);

      setPatients(patientsData || []);
      setAppointments(appointmentsData || []);
      setInvoices(invoicesData || []);

      // Fetch compliance in a single batch request
      const patientList = patientsData || [];
      const patientIds = patientList.slice(0, 20).map(p => p.id).join(",");
      if (patientIds) {
        try {
          const complianceMap = await api.get(
            `/medications/compliance/batch?patient_ids=${patientIds}`
          );

          const alertList = [];
          for (const patient of patientList.slice(0, 20)) {
            const compliance = complianceMap[patient.id];
            if (compliance && compliance.adherence_percentage < 70) {
              alertList.push({
                patient,
                adherence: compliance.adherence_percentage,
                missed: compliance.missed_count || 0,
              });
            }
          }
          setComplianceAlerts(alertList);
        } catch (err) {
          console.error("Failed to load compliance:", err);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.greeting}>
          Practice Analytics
        </div>
        <div className={styles.stats}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className={styles.grid}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const patientMap = Object.fromEntries(
    patients.map((p) => [p.id, `${p.first_name} ${p.last_name}`])
  );

  const todayAppointments = appointments.filter(
    (a) => a.datetime && isToday(a.datetime)
  );

  const totalPatients = patients.length;

  // Compute total revenue from paid invoices
  const totalRevenue = invoices.reduce((acc, inv) => {
    return inv.status === "paid" ? acc + Number(inv.amount || 0) : acc;
  }, 0);

  // Calculate average adherence across compliance alerts + compliant patients
  const overallAdherence =
    complianceAlerts.length > 0
      ? Math.round(
          complianceAlerts.reduce((sum, a) => sum + a.adherence, 0) /
            complianceAlerts.length
        )
      : 100;

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
      <div className={styles.greeting}>
        Practice Analytics
        <div className={styles.greetingSub}>
          {getGreeting()}, Dr. {user?.last_name || "Doctor"}. Here is your clinical and operational overview.
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <Users size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{totalPatients}</div>
            <div className={styles.statLabel}>Active Patients</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconTeal}`}>
            <DollarSign size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{formatCurrency(totalRevenue)}</div>
            <div className={styles.statLabel}>Total Revenue</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <Activity size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{overallAdherence}%</div>
            <div className={styles.statLabel}>Platform Adherence</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
         <button onClick={() => router.push('/doctor/patients')} style={{ flex: 1, padding: 'var(--space-4)', backgroundColor: 'var(--primary-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <Users size={18} /> Invite New Patient
         </button>
         <button onClick={() => router.push('/doctor/appointments')} style={{ flex: 1, padding: 'var(--space-4)', backgroundColor: 'var(--blue-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <CalendarDays size={18} /> Schedule Appointment
         </button>
         <button onClick={() => router.push('/doctor/invoices')} style={{ flex: 1, padding: 'var(--space-4)', backgroundColor: 'var(--teal-600)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <DollarSign size={18} /> Create Invoice
         </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <Clock size={18} />
            Today&apos;s Appointments
          </div>
          {todayAppointments.length === 0 ? (
            <div className={styles.empty}>No appointments scheduled today.</div>
          ) : (
            todayAppointments.map((apt) => (
              <div key={apt.id} className={styles.appointmentItem}>
                <div className={styles.appointmentInfo}>
                  <span className={styles.appointmentName}>
                    {patientMap[apt.patient_id] || `Patient #${apt.patient_id}`}
                  </span>
                  <span className={styles.appointmentTime}>
                    {formatTime(apt.datetime)}
                  </span>
                </div>
                <StatusBadge status={apt.status || "booked"} />
              </div>
            ))
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <AlertTriangle size={18} />
            Compliance Alerts
          </div>
          {complianceAlerts.length === 0 ? (
            <div className={styles.empty}>
              All patients are on track with their medications.
            </div>
          ) : (
            complianceAlerts.map((alert) => (
              <div key={alert.patient.id} className={styles.alertItem}>
                <div className={styles.alertIcon}>
                  <AlertTriangle size={16} />
                </div>
                <div className={styles.alertInfo}>
                  <div className={styles.alertName}>
                    {alert.patient.first_name} {alert.patient.last_name}
                  </div>
                  <div className={styles.alertDetail}>
                    {alert.adherence}% adherence &middot; {alert.missed} doses
                    missed
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
