"use client";

import Link from "next/link";
import styles from "../privacy/page.module.css"; // Reuse the same styles
import { ChevronLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backLink}>
            <ChevronLeft size={20} />
            Back to Home
          </Link>
          <Link href="/" className={styles.logo}>Alo Doctor</Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last Updated: February 2026</p>

          <section className={styles.section}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Alo Doctor, a platform operated in the Republic of Mauritius, 
              you agree to be bound by these Terms of Service. If you do not agree to these terms, 
              please do not use our services.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Not Medical Advice</h2>
            <p>
              Alo Doctor is a technology platform designed to facilitate scheduling and medication tracking 
              between licensed healthcare professionals and their patients. <strong>Alo Doctor itself does not 
              provide medical advice, diagnosis, or treatment.</strong> Always seek the advice of your physician 
              or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. For Doctors</h2>
            <ul>
              <li>You must be a licensed medical practitioner registered with the Medical Council of Mauritius.</li>
              <li>You are solely responsible for the medical care, advice, and prescriptions provided to patients through the platform.</li>
              <li>You agree to comply with the Data Protection Act 2017 when managing patient records within your practice.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. For Patients</h2>
            <ul>
              <li>You agree to provide accurate phone numbers and information for appointment bookings.</li>
              <li>Consultation fees are displayed in Mauritian Rupees (MUR) and are payable directly to the healthcare provider.</li>
              <li>No-show policies are enforced at the discretion of the individual doctor.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by Mauritian law, Alo Doctor shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages resulting from your access to or use of, or inability to access or 
              use, the platform.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the Republic of Mauritius, 
              without regard to its conflict of law provisions.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
