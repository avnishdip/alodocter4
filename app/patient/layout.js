"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { Home, Pill, Calendar, User } from "lucide-react";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { href: "/patient/home", label: "Home", icon: Home },
  { href: "/patient/medications", label: "Meds", icon: Pill },
  { href: "/patient/appointments", label: "Appointments", icon: Calendar },
  { href: "/patient/profile", label: "Profile", icon: User },
];

export default function PatientLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (hydrated && (!isAuthenticated || role !== "patient")) {
      router.push("/login");
    }
  }, [hydrated, isAuthenticated, role, router]);

  if (!hydrated || !isAuthenticated || role !== "patient") {
    return null;
  }

  return (
    <div className={styles.layout}>
      <main className={styles.main} role="main">{children}</main>
      <nav className={styles.bottomNav} role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              {...(isActive ? { "aria-current": "page" } : {})}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
