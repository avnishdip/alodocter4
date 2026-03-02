"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import styles from "./landing.module.css";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.push(role === "doctor" ? "/doctor/dashboard" : "/patient/home");
    }
  }, [hydrated, isAuthenticated, role, router]);

  // Render the page normally. 
  // We don't return null/blank here because Next.js needs to statically render the marketing content.
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>Alo<span className={styles.logoDot}>.</span></Link>
        <Link href="/login" className={styles.signInBtn}>Sign In</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBadge}>Built for Mauritius</div>
        <h1 className={styles.heroTitle}>
          The clinical operating system for <span className={styles.heroBlue}>modern practice.</span>
        </h1>
        <p className={styles.heroDesc}>
          A highly secure, beautifully simple platform for independent practitioners. Elevate your clinic without the administrative overhead.
        </p>
        <div>
          <Link href="/onboarding" className={styles.heroBtn}>
            Set up your clinic
          </Link>
        </div>
      </section>

      <section className={styles.catalogue}>
        {/* Step 1: Discovery & Scheduling */}
        <div className={styles.step}>
          <div className={styles.stepText}>
            <div className={styles.stepNumber}>01. Scheduling</div>
            <h2 className={styles.stepTitle}>Frictionless Patient Booking</h2>
            <p className={styles.stepDesc}>
              Patients view your live availability, pick a time, and provide their symptoms upfront. No more manual data entry or phone tag.
            </p>
          </div>
          <div className={styles.windowWrapper}>
            <div className={styles.windowBg}></div>
            <div className={styles.window}>
              <div className={styles.windowHeader}>
                <div className={`${styles.dot} ${styles.dotRed}`}></div>
                <div className={`${styles.dot} ${styles.dotYellow}`}></div>
                <div className={`${styles.dot} ${styles.dotGreen}`}></div>
              </div>
              <div className={styles.windowBody}>
                <div className={styles.mockBookingHeader}>
                  <div className={styles.mockAvatar}>AL</div>
                  <div>
                    <div className={styles.mockDocName}>Dr. Alo Doctor</div>
                    <div className={styles.mockDocSpec}>General Practitioner &middot; Port Louis</div>
                  </div>
                </div>
                <div className={styles.mockDates}>
                   <div className={`${styles.mockDate} ${styles.mockDateActive}`}>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Mon</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>14</div>
                   </div>
                   <div className={styles.mockDate}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tue</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>15</div>
                   </div>
                   <div className={styles.mockDate}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Wed</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>16</div>
                   </div>
                </div>
                <div className={styles.mockGrid}>
                  <div className={styles.mockSlot}>09:00 AM</div>
                  <div className={styles.mockSlot}>09:30 AM</div>
                  <div className={styles.mockSlot}>10:00 AM</div>
                  <div className={`${styles.mockSlot} ${styles.mockSlotBlue}`}>10:30 AM</div>
                  <div className={styles.mockSlot}>11:00 AM</div>
                  <div className={styles.mockSlot}>11:30 AM</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Digital Prescriptions */}
        <div className={`${styles.step} ${styles.stepReverse}`}>
          <div className={styles.stepText}>
            <div className={styles.stepNumber}>02. Care</div>
            <h2 className={styles.stepTitle}>The Digital Prescription</h2>
            <p className={styles.stepDesc}>
              Construct detailed medication plans instantly. Specify dosages, frequencies, and exact times. The platform handles the rest.
            </p>
          </div>
          <div className={styles.windowWrapper}>
             <div className={styles.windowBg}></div>
             <div className={styles.window}>
              <div className={styles.windowHeader}>
                <div className={`${styles.dot} ${styles.dotRed}`}></div>
                <div className={`${styles.dot} ${styles.dotYellow}`}></div>
                <div className={`${styles.dot} ${styles.dotGreen}`}></div>
              </div>
              <div className={styles.windowBody}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '20px', fontSize: '1.1rem' }}>Create Medication Plan</div>
                <div className={styles.mockFormRow}>
                  <div className={styles.mockFormGroup}>
                     <label className={styles.mockLabel}>Medication Name</label>
                     <div className={`${styles.mockInput} ${styles.mockInputActive}`}>Metformin</div>
                  </div>
                  <div className={styles.mockFormGroup}>
                     <label className={styles.mockLabel}>Dosage</label>
                     <div className={styles.mockInput}>500mg</div>
                  </div>
                </div>
                <div className={styles.mockFormGroup} style={{ marginBottom: '20px' }}>
                     <label className={styles.mockLabel}>Frequency</label>
                     <div className={styles.mockInput}>Twice Daily</div>
                </div>
                <div className={styles.mockFormGroup}>
                     <label className={styles.mockLabel}>Scheduled Times</label>
                     <div className={styles.mockTagRow}>
                        <span className={styles.mockTag}>08:00</span>
                        <span className={styles.mockTag}>20:00</span>
                     </div>
                </div>
                <div className={styles.mockBtnPrimary}>Save Plan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: SMS Tracking */}
        <div className={styles.step}>
          <div className={styles.stepText}>
            <div className={styles.stepNumber}>03. Adherence</div>
            <h2 className={styles.stepTitle}>Automated SMS & Tracking</h2>
            <p className={styles.stepDesc}>
              Patients receive critical pill reminders directly via SMS to their Mauritian numbers. They simply open their secure portal to log doses.
            </p>
          </div>
          <div className={styles.windowWrapper}>
            <div className={styles.mockPhoneContainer}>
              <div className={styles.mockPhone}>
                <div className={styles.mockPhoneNotch}></div>
                <div className={styles.mockAppHeader}>
                   <div className={styles.mockAppGreeting}>Hi Jean 👋</div>
                   <div className={styles.mockAppSub}>Your daily schedule</div>
                </div>
                <div className={styles.mockAppBody}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>Today</div>
                   <div className={`${styles.mockAppCard} ${styles.mockAppCardDone}`}>
                      <div>
                         <div className={styles.mockAppCardTime}>08:00 AM</div>
                         <div className={styles.mockAppCardName}>Metformin</div>
                         <div style={{ fontSize: '0.8rem', color: '#64748b' }}>500mg</div>
                      </div>
                      <div className={styles.mockCheck}></div>
                   </div>
                   <div className={styles.mockAppCard}>
                      <div>
                         <div className={styles.mockAppCardTime}>20:00 PM</div>
                         <div className={styles.mockAppCardName}>Metformin</div>
                         <div style={{ fontSize: '0.8rem', color: '#64748b' }}>500mg</div>
                      </div>
                      <div className={styles.mockPending}></div>
                   </div>
                </div>
              </div>
              
              {/* Overlapping SMS */}
              <div className={styles.floatingSms}>
                 <div className={styles.floatingSmsHeader}>
                    <div className={styles.smsIcon}></div>
                    <div className={styles.smsSender}>Alo Doctor</div>
                 </div>
                 <div className={styles.smsText}>
                    N'oubliez pas de prendre votre médicament (Metformin) ce soir à 20h00.
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Billing & Analytics */}
        <div className={`${styles.step} ${styles.stepReverse}`}>
          <div className={styles.stepText}>
            <div className={styles.stepNumber}>04. Operations</div>
            <h2 className={styles.stepTitle}>Intelligence & Billing</h2>
            <p className={styles.stepDesc}>
              Identify which patients are falling behind on treatment before they enter your office. Generate professional invoices in one click.
            </p>
          </div>
          <div className={styles.windowWrapper}>
             <div className={styles.windowBg}></div>
             <div className={styles.window}>
              <div className={styles.windowHeader}>
                <div className={`${styles.dot} ${styles.dotRed}`}></div>
                <div className={`${styles.dot} ${styles.dotYellow}`}></div>
                <div className={`${styles.dot} ${styles.dotGreen}`}></div>
              </div>
              <div className={styles.windowBody}>
                <table className={styles.mockTable}>
                   <thead>
                      <tr>
                         <th className={styles.mockTh}>Patient</th>
                         <th className={styles.mockTh}>Adherence</th>
                         <th className={styles.mockTh}>Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className={styles.mockTd}>
                            <div className={styles.mockPatientName}>Jean Dupont</div>
                            <div className={styles.mockPatientCond}>Type 2 Diabetes</div>
                         </td>
                         <td className={styles.mockTd}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>92%</div>
                            <div className={styles.mockProgressBg}>
                               <div className={styles.mockProgressFill}></div>
                            </div>
                         </td>
                         <td className={styles.mockTd}>
                            <div className={`${styles.mockBadge} ${styles.mockBadgeGreen}`}>On Track</div>
                         </td>
                      </tr>
                      <tr>
                         <td className={styles.mockTd}>
                            <div className={styles.mockPatientName}>Marie L.</div>
                            <div className={styles.mockPatientCond}>Hypertension</div>
                         </td>
                         <td className={styles.mockTd}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>45%</div>
                            <div className={styles.mockProgressBg}>
                               <div className={`${styles.mockProgressFill} ${styles.mockProgressFillWarning}`}></div>
                            </div>
                         </td>
                         <td className={styles.mockTd}>
                            <div className={`${styles.mockBadge} ${styles.mockBadgeBlue}`}>Intervene</div>
                         </td>
                      </tr>
                   </tbody>
                </table>

                {/* Overlapping Invoice Modal */}
                <div className={styles.mockInvoiceModal}>
                   <div className={styles.mockInvoiceTitle}>Invoice #INV-204</div>
                   <div className={styles.mockInvoiceRow}>
                      <span>Consultation</span>
                      <span>MUR 1500</span>
                   </div>
                   <div className={styles.mockInvoiceRow}>
                      <span>Date</span>
                      <span>14 Oct 2026</span>
                   </div>
                   <div className={styles.mockInvoiceTotal}>
                      <span>Total</span>
                      <span>MUR 1500</span>
                   </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </section>

      <footer className={styles.footer}>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "16px" }}>
          <Link href="/terms" className={styles.footerLink}>Terms</Link>
          <Link href="/privacy" className={styles.footerLink}>Privacy</Link>
        </div>
        <p>&copy; 2026 Alo Doctor. Built for Mauritius.</p>
      </footer>
    </div>
  );
}
