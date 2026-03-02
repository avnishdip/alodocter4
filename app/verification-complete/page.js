import Link from "next/link";
import { CheckCircle } from "lucide-react";
import styles from "./page.module.css";

export default function VerificationCompletePage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <CheckCircle className={styles.icon} />
        </div>
        <h1 className={styles.title}>Verification Complete</h1>
        <p className={styles.description}>
          Your email address has been successfully verified. You can now access your Alo Doctor account and start managing your practice.
        </p>
        <Link href="/login" className={styles.button}>
          Continue to Login
        </Link>
      </div>
    </div>
  );
}
