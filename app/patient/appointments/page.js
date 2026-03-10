"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import styles from "./page.module.css";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get("/appointments/");
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setError("Failed to load data. Please try again.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const now = new Date();

  const upcoming = appointments
    .filter(
      (a) =>
        new Date(a.datetime) >= now &&
        a.status !== "cancelled" &&
        a.status !== "completed"
    )
    .sort(
      (a, b) =>
        new Date(a.datetime) -
        new Date(b.datetime || b.datetime)
    );

  const past = appointments
    .filter(
      (a) =>
        new Date(a.datetime) < now ||
        a.status === "completed" ||
        a.status === "cancelled"
    )
    .sort(
      (a, b) =>
        new Date(b.datetime || b.datetime) -
        new Date(a.datetime)
    );

  const displayList = activeTab === "upcoming" ? upcoming : past;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Appointments</h1>

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
          <button onClick={() => { setError(null); fetchAppointments(); }} style={{
            background: 'var(--red-600)',
            color: 'white',
            border: 'none',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}>Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "upcoming" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`${styles.tab} ${activeTab === "past" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("past")}
        >
          Past
        </button>
      </div>

      {/* Appointment list */}
      {displayList.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Calendar size={36} color="var(--gray-300)" />
          </div>
          {activeTab === "upcoming"
            ? "No upcoming appointments"
            : "No past appointments"}
        </div>
      ) : (
        displayList.map((appt) => {
          const dt = appt.datetime;
          const status = appt.status || "scheduled";
          return (
            <div key={appt.id} className={styles.appointmentCard}>
              <div className={styles.appointmentHeader}>
                <div className={styles.doctorName}>
                  {appt.doctor_name || "Your Doctor"}
                </div>
                <StatusBadge status={status} />
              </div>
              <div className={styles.appointmentDateTime}>
                <Calendar size={14} />
                <span>{formatDate(dt)}</span>
                <Clock size={14} />
                <span>{formatTime(dt)}</span>
              </div>
              {appt.type && (
                <div className={styles.appointmentType}>{appt.type}</div>
              )}
            </div>
          );
        })
      )}

      {/* Book appointment button */}
      <Link href="/patient/appointments/book" className={styles.bookButton}>
        Book Appointment
      </Link>
    </div>
  );
}
