"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { api } from "@/lib/api";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import styles from "./page.module.css";

function getNext7Weekdays() {
  const days = [];
  const today = new Date();
  let current = new Date(today);
  current.setDate(current.getDate() + 1); // Start from tomorrow

  while (days.length < 7) {
    const dayOfWeek = current.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function formatTimeSlot(timeStr) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function formatFullDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorIdFromUrl = searchParams.get("doctor_id");
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [doctorId, setDoctorId] = useState(doctorIdFromUrl || user?.doctor_id || null);

  const weekdays = useMemo(() => getNext7Weekdays(), []);

  // Resolve doctor ID from URL params or patient profile
  useEffect(() => {
    async function loadDoctorId() {
      if (doctorIdFromUrl) {
        setDoctorId(doctorIdFromUrl);
        return;
      }
      try {
        const patient = await api.get("/patients/me");
        if (patient.doctor_ids?.length > 0) {
          setDoctorId(patient.doctor_ids[0]);
        }
      } catch (err) {
        console.error("Failed to load doctor ID:", err);
      }
    }
    if (!doctorId) loadDoctorId();
  }, [doctorIdFromUrl, doctorId]);

  // Fetch real availability slots when date changes
  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (!doctorId) return;
    setLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await api.get(
        `/appointments/available-slots?doctor_id=${doctorId}&date=${dateStr}`
      );
      setSlots(res.slots || []);
    } catch (err) {
      console.error("Failed to load slots:", err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;

    setBooking(true);
    setError(null);

    try {
      // Build the datetime properly using local date components
      const [year, month, day] = selectedDate.toISOString().split("T")[0].split("-");
      const [hours, minutes] = selectedTime.split(":");
      const bookingDatetime = new Date(year, month - 1, day, hours, minutes).toISOString();

      await api.post("/appointments/", {
        doctor_id: doctorId,
        datetime: bookingDatetime,
        notes: notes.trim(),
      });

      router.push("/patient/appointments");
    } catch (err) {
      console.error("Booking failed:", err);
      setError(err.message || "Failed to book appointment. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Book Appointment</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Step 1: Pick a date */}
      <div className={styles.stepLabel}>1. Choose a date</div>
      <div className={styles.daySelector}>
        {weekdays.map((date) => {
          const isSelected =
            selectedDate &&
            date.toDateString() === selectedDate.toDateString();
          return (
            <button
              key={date.toISOString()}
              className={`${styles.dayCard} ${isSelected ? styles.dayCardSelected : ""}`}
              onClick={() => handleDateSelect(date)}
            >
              <span className={styles.dayName}>
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span className={styles.dayNumber}>{date.getDate()}</span>
              <span className={styles.dayMonth}>
                {date.toLocaleDateString("en-US", { month: "short" })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step 2: Pick a time */}
      {selectedDate && (
        <>
          <div className={styles.stepLabel}>2. Choose a time</div>
          {loadingSlots ? (
            <div className={styles.empty}>Loading available slots...</div>
          ) : slots.length === 0 ? (
            <div className={styles.empty}>No slots available for this date.</div>
          ) : (
            <div className={styles.slotGrid}>
              {slots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    className={`${styles.slot} ${isSelected ? styles.slotSelected : ""}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {formatTimeSlot(time)}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Step 3: Confirm */}
      {selectedDate && selectedTime && (
        <>
          <div className={styles.stepLabel}>3. Additional Details (Optional)</div>
          <div className={styles.inputGroup} style={{ marginBottom: "var(--space-6)" }}>
             <textarea 
                className={styles.textarea} 
                style={{ width: "100%", padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)", minHeight: "80px", resize: "vertical", fontFamily: "inherit" }}
                placeholder="Reason for visit or any symptoms you want the doctor to know beforehand..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
             />
          </div>

          <div className={styles.confirmCard}>
            <div className={styles.confirmTitle}>Confirm your booking</div>
            <div className={styles.confirmRow}>
              <Calendar size={16} color="var(--gray-400)" />
              <span className={styles.confirmLabel}>Date</span>
              <span>{formatFullDate(selectedDate)}</span>
            </div>
            <div className={styles.confirmRow}>
              <Clock size={16} color="var(--gray-400)" />
              <span className={styles.confirmLabel}>Time</span>
              <span>{formatTimeSlot(selectedTime)}</span>
            </div>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={handleBook}
            disabled={booking}
          >
            {booking ? "Booking..." : "Confirm Appointment"}
          </button>
        </>
      )}
    </div>
  );
}
