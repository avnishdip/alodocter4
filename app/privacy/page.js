"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last Updated: February 2026</p>

          <section className={styles.section}>
            <h2>1. Introduction</h2>
            <p>
              Alo Doctor ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. 
              This privacy policy explains how we collect, process, and safeguard your personal and medical information 
              in strict accordance with the <strong>Data Protection Act 2017 (DPA) of Mauritius</strong>.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. The Data We Collect</h2>
            <p>Under the DPA 2017, health information is classified as a "special category of personal data" (sensitive data). We collect:</p>
            <ul>
              <li><strong>Identity & Contact Data:</strong> Name, phone number, date of birth.</li>
              <li><strong>Health & Medical Data:</strong> Medical conditions, medication plans, and appointment history as entered by your doctor or yourself.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, and device information for security and analytics.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. How We Use Your Data</h2>
            <p>We process your data legally under the following principles:</p>
            <ul>
              <li><strong>Explicit Consent:</strong> You consent to data processing when verifying your phone number (OTP).</li>
              <li><strong>Medical Necessity:</strong> To facilitate healthcare provision, medical diagnosis, and treatment management by healthcare professionals bound by professional secrecy.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Data Security</h2>
            <p>
              We have implemented appropriate security measures, including encryption in transit and at rest, to prevent your 
              personal data from being accidentally lost, used, or accessed in an unauthorized way. In the event of a suspected 
              data breach, we will notify you and the Data Protection Office of Mauritius within 72 hours, as required by law.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Data Retention</h2>
            <p>
              We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, 
              including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements in Mauritius.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Your Legal Rights</h2>
            <p>Under the DPA 2017, you have the right to:</p>
            <ul>
              <li>Request access to your personal data.</li>
              <li>Request correction of the personal data that we hold about you.</li>
              <li>Request erasure of your personal data.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p>To exercise any of these rights, please contact your primary healthcare provider or email us at privacy@alodoctor.mu.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
