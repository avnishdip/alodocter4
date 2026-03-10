"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { LayoutDashboard, Users, Calendar, Pill, FileText, Clock, User, LogOut } from "lucide-react";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
  { href: "/doctor/medications", label: "Medications", icon: Pill },
  { href: "/doctor/invoices", label: "Invoices", icon: FileText },
  { href: "/doctor/availability", label: "Availability", icon: Clock },
];

export default function DoctorLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isAuthenticated, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand persist to finish rehydrating from localStorage
    if (useAuthStore.persist.hasHydrated()) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (hydrated && (!isAuthenticated || role !== "doctor")) {
      router.push("/login");
    }
  }, [hydrated, isAuthenticated, role, router]);

  if (!hydrated || !isAuthenticated || role !== "doctor") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.logo}>Alo Doctor</span>
          <nav className={styles.nav}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${pathname === href || pathname.startsWith(href + "/") ? styles.navLinkActive : ""}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className={styles.headerRight}>
            <Link href="/doctor/profile" className={styles.profileLink}>
              <User size={18} />
              <span>Dr. {user?.last_name}</span>
            </Link>
            <button onClick={handleLogout} className={styles.logoutButton} title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
