"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Save, CheckCircle2 } from "lucide-react";
import styles from "./page.module.css";

const DAYS = [
  { key: 0, label: "Monday" },
  { key: 1, label: "Tuesday" },
  { key: 2, label: "Wednesday" },
  { key: 3, label: "Thursday" },
  { key: 4, label: "Friday" },
  { key: 5, label: "Saturday" },
  { key: 6, label: "Sunday" },
];

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

function defaultSchedule() {
  return DAYS.map((d) => ({
    day_of_week: d.key,
    enabled: d.key < 6, // Monday-Saturday enabled by default
    start_time: "09:00",
    end_time: "17:00",
    slot_duration: 30,
  }));
}

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState(defaultSchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get("/doctors/me/availability");

        if (data && Array.isArray(data) && data.length > 0) {
          // Merge fetched data with defaults
          const merged = DAYS.map((d) => {
            const found = data.find((item) => item.day_of_week === d.key);
            if (found) {
              return {
                day_of_week: d.key,
                enabled: found.enabled !== false,
                start_time: found.start_time || "09:00",
                end_time: found.end_time || "17:00",
                slot_duration: found.slot_duration || 30,
              };
            }
            return {
              day_of_week: d.key,
              enabled: false,
              start_time: "09:00",
              end_time: "17:00",
              slot_duration: 30,
            };
          });
          setSchedule(merged);
        }
      } catch {
        // If no availability exists yet, use defaults
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, []);

  function updateDay(index, field, value) {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
    setSaved(false);
  }

  function copyFirstDayToAll() {
    if (schedule.length === 0) return;
    const firstDay = schedule[0];
    const updated = schedule.map((day, idx) => {
        if (idx === 0) return day;
        return {
            ...day,
            start_time: firstDay.start_time,
            end_time: firstDay.end_time,
            slot_duration: firstDay.slot_duration,
            enabled: firstDay.enabled
        };
    });
    setSchedule(updated);
    setSaved(false);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);

      // Only send enabled slots to backend
      const toSave = schedule.filter(s => s.enabled);
      await api.put("/doctors/me/availability", toSave);
      setSaved(true);

      // Auto-hide success message after 3s
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading availability...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Availability</h1>
          <p className={styles.pageSubtitle}>
            Set your weekly schedule. Patients will be able to book during these
            hours.
          </p>
        </div>
        <button
          onClick={copyFirstDayToAll}
          style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', color: 'var(--gray-700)', boxShadow: 'var(--shadow-sm)' }}
        >
          Copy Monday to All Days
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.headerRow}>
          <span className={styles.headerLabel}>Day</span>
          <span className={styles.headerLabel}>Active</span>
          <span className={styles.headerLabel}>Start Time</span>
          <span className={styles.headerLabel}>End Time</span>
          <span className={styles.headerLabel}>Slot Duration</span>
        </div>

        {schedule.map((day, index) => {
          const dayInfo = DAYS.find((d) => d.key === day.day_of_week);
          return (
            <div key={day.day_of_week} className={styles.dayRow}>
              <span
                className={`${styles.dayName} ${
                  !day.enabled ? styles.dayNameOff : ""
                }`}
              >
                {dayInfo?.label}
              </span>

              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={day.enabled}
                  onChange={(e) =>
                    updateDay(index, "enabled", e.target.checked)
                  }
                />
                <span className={styles.toggleSlider} />
              </label>

              <div>
                <input
                  type="time"
                  className={styles.input}
                  value={day.start_time}
                  onChange={(e) =>
                    updateDay(index, "start_time", e.target.value)
                  }
                  disabled={!day.enabled}
                />
              </div>

              <div>
                <input
                  type="time"
                  className={styles.input}
                  value={day.end_time}
                  onChange={(e) =>
                    updateDay(index, "end_time", e.target.value)
                  }
                  disabled={!day.enabled}
                />
              </div>

              <div>
                <select
                  className={styles.select}
                  value={day.slot_duration}
                  onChange={(e) =>
                    updateDay(index, "slot_duration", parseInt(e.target.value))
                  }
                  disabled={!day.enabled}
                >
                  {SLOT_DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        {error && (
          <div className={styles.error} style={{ paddingTop: "var(--space-4)" }}>
            {error}
          </div>
        )}

        <div className={styles.footer}>
          {saved && (
            <span className={styles.successMsg}>
              <CheckCircle2 size={16} />
              Availability saved
            </span>
          )}
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
