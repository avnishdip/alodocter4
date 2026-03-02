"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { api } from "@/lib/api";
import { Pill, TrendingUp, Flame } from "lucide-react";
import styles from "./page.module.css";

function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function classifyTime(timeStr) {
  const hour = parseInt(timeStr.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatLogDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MedicationsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("schedule");
  const [plans, setPlans] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [plansData, complianceData] = await Promise.all([
        api.get("/medications/plans").catch(() => []),
        user?.id
          ? api.get(`/medications/compliance/${user.id}`).catch(() => null)
          : Promise.resolve(null),
      ]);

      setPlans(Array.isArray(plansData) ? plansData : []);
      setCompliance(complianceData);
    } catch (err) {
      console.error("Failed to load medications data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group plans by time of day for the schedule tab
  const grouped = { morning: [], afternoon: [], evening: [] };
  plans.forEach((plan) => {
    if (!plan.active && plan.active !== undefined) return;
    const times = plan.times || [];
    times.forEach((time) => {
      const period = classifyTime(time);
      grouped[period].push({
        ...plan,
        displayTime: time,
      });
    });
  });

  // Sort each group by time
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => a.displayTime.localeCompare(b.displayTime));
  });

  const adherencePercent = compliance?.adherence_percentage ?? compliance?.adherence ?? null;
  const streak = compliance?.current_streak ?? compliance?.streak ?? 0;
  const recentLogs = compliance?.recent_logs || compliance?.logs || [];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Medications</h1>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "schedule" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          Schedule
        </button>
        <button
          className={`${styles.tab} ${activeTab === "history" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      {activeTab === "schedule" && (
        <>
          {plans.length === 0 ? (
            <div className={styles.emptyState}>
              <Pill size={32} color="var(--gray-300)" style={{ marginBottom: 8 }} />
              <div>No medications assigned yet.</div>
            </div>
          ) : (
            <>
              {["morning", "afternoon", "evening"].map((period) => {
                if (grouped[period].length === 0) return null;
                const labels = {
                  morning: "Morning",
                  afternoon: "Afternoon",
                  evening: "Evening",
                };
                return (
                  <div key={period} className={styles.timeGroup}>
                    <div className={styles.timeGroupTitle}>{labels[period]}</div>
                    <div className={styles.card}>
                      {grouped[period].map((med, idx) => (
                        <div key={`${med.id}_${med.displayTime}_${idx}`} className={styles.medItem}>
                          <div className={styles.medInfo}>
                            <div className={styles.medName}>{med.medication_name}</div>
                            <div className={styles.medDosage}>{med.dosage}</div>
                            <div className={styles.medFrequency}>
                              {med.frequency || "Daily"}
                            </div>
                          </div>
                          <div className={styles.medTime}>
                            {formatTime(med.displayTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {activeTab === "history" && (
        <>
          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <TrendingUp size={20} color="var(--primary-500)" style={{ marginBottom: 4 }} />
              <div className={styles.bigStat}>
                {adherencePercent !== null ? `${Math.round(adherencePercent)}%` : "--"}
              </div>
              <div className={styles.statLabel}>Adherence</div>
            </div>
            <div className={styles.statCard}>
              <Flame size={20} color="var(--amber-500)" style={{ marginBottom: 4 }} />
              <div className={styles.bigStat}>{streak}</div>
              <div className={styles.statLabel}>Day Streak</div>
            </div>
          </div>

          {/* Recent logs */}
          <div className={styles.historySection}>
            <div className={styles.historyTitle}>Recent Activity</div>

            {recentLogs.length === 0 ? (
              <div className={styles.emptyState}>No medication logs yet.</div>
            ) : (
              recentLogs.slice(0, 30).map((log, idx) => {
                const status = log.status || "taken";
                const badgeClass =
                  status === "taken"
                    ? styles.badgeTaken
                    : status === "missed"
                    ? styles.badgeMissed
                    : styles.badgeSkipped;

                return (
                  <div key={log.id || idx} className={styles.logEntry}>
                    <div className={styles.logDate}>
                      {formatLogDate(log.scheduled_at || log.created_at || log.date)}
                    </div>
                    <div className={styles.logMed}>
                      {log.medication_name || log.med_name || "Medication"}
                    </div>
                    <span className={badgeClass}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
