"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { MapPin, Calendar, Clock, ChevronLeft } from "lucide-react";
import styles from "./page.module.css";
import { useAuthStore } from "@/lib/stores/authStore";

export default function PublicDoctorProfile() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [docData, availData] = await Promise.all([
          api.get(`/doctors/public/${params.id}`),
          api.get(`/doctors/public/${params.id}/availability`),
        ]);
        setDoctor(docData);
        setAvailability(availData || []);
      } catch (err) {
        setError("Doctor not found or not public.");
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleBook = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/patient/appointments/book?doctor_id=${doctor.id}`);
    } else if (role === "patient") {
      router.push(`/patient/appointments/book?doctor_id=${doctor.id}`);
    } else {
      alert("Doctors cannot book appointments.");
    }
  };

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!doctor) return null;

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/search" className={styles.backLink}>
            <ChevronLeft size={20} />
            Back to Search
          </Link>
          <Link href="/" className={styles.logo}>Alo Doctor</Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarLarge}>
             {doctor.first_name[0]}{doctor.last_name[0]}
          </div>
          <div>
            <h1 className={styles.name}>Dr. {doctor.first_name} {doctor.last_name}</h1>
            <p className={styles.specialty}>{doctor.specialty}</p>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.mainContent}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About</h2>
              <p className={styles.bio}>{doctor.bio || "No biography provided."}</p>
            </section>
            
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Consultation Fee</h2>
              <p className={styles.fee}>MUR {doctor.fee}</p>
            </section>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.bookingCard}>
              <h3 className={styles.bookingTitle}>Book an Appointment</h3>
              
              <div className={styles.availabilityList}>
                <h4 className={styles.availHeader}>Typical Availability</h4>
                {availability.length === 0 ? (
                  <p className={styles.noAvail}>No availability set.</p>
                ) : (
                  availability.map(slot => (
                    <div key={slot.id} className={styles.availRow}>
                      <span className={styles.availDay}>{DAYS[slot.day_of_week]}</span>
                      <span className={styles.availTime}>
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button 
                className={styles.bookButton}
                onClick={handleBook}
              >
                <Calendar size={18} />
                Book Now
              </button>
              {!isAuthenticated && (
                <p className={styles.loginHint}>You will be asked to sign in with your phone number to confirm.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
