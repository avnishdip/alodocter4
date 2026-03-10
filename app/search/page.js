"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Search, ChevronRight } from "lucide-react";
import styles from "./page.module.css";

export default function SearchPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        // Assuming we update the backend to support a search query, or we just filter client-side for MVP
        const data = await api.get("/doctors/public");
        setDoctors(data || []);
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doc => {
    if (!query) return true;
    const searchStr = query.toLowerCase();
    return (
      (doc.first_name + " " + doc.last_name).toLowerCase().includes(searchStr) ||
      (doc.specialty || "").toLowerCase().includes(searchStr)
    );
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>Alo Doctor</Link>
          <Link href="/login" className={styles.loginLink}>Sign In</Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.searchSection}>
          <h1 className={styles.title}>Find the right doctor for you</h1>
          <p className={styles.subtitle}>Book appointments with top healthcare professionals in Mauritius.</p>
          
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search by name or specialty (e.g. Cardiologist)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.resultsSection}>
          {loading ? (
            <div className={styles.loading}>Loading available doctors...</div>
          ) : filteredDoctors.length === 0 ? (
            <div className={styles.empty}>No doctors found matching "{query}".</div>
          ) : (
            <div className={styles.grid}>
              {filteredDoctors.map(doctor => (
                <Link href={`/d/${doctor.id}`} key={doctor.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatar}>
                      {doctor.first_name[0]}{doctor.last_name[0]}
                    </div>
                    <div>
                      <h2 className={styles.docName}>Dr. {doctor.first_name} {doctor.last_name}</h2>
                      <p className={styles.docSpecialty}>{doctor.specialty}</p>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Consultation Fee</span>
                      <span className={styles.infoValue}>MUR {doctor.fee}</span>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <span>View Profile & Book</span>
                    <ChevronRight size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
