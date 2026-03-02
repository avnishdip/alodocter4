"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle } from "lucide-react";
import styles from "./page.module.css";

export default function VerificationCompletePage() {
  const router = useRouter();

  useEffect(() => {
    // Small delay to ensure session is registered, then auto-redirect to onboarding step 2
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTimeout(() => {
          router.push('/onboarding');
        }, 3000);
      }
    };
    checkSession();
  }, [router]);

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
        <Link href="/onboarding" className={styles.button}>
          Continue Onboarding
        </Link>
      </div>
    </div>
  );
}
