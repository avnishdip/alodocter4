"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  FileText,
  Plus,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonRow } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

function formatCurrency(amount) {
  if (amount == null) return "MUR 0";
  return `MUR ${Number(amount).toLocaleString("en-MU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoicesPage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Print view state
  const [printingInvoice, setPrintingInvoice] = useState(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    amount: "",
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [invoicesData, patientsData] = await Promise.all([
        api.get("/invoices/"),
        api.get("/patients/"),
      ]);
      setInvoices(invoicesData || []);
      setPatients(patientsData || []);
    } catch (err) {
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function getPatient(patientId) {
    return patients.find((pt) => String(pt.id) === String(patientId));
  }

  function openCreate() {
    setForm({
      patient_id: patients.length > 0 ? patients[0].id : "",
      amount: "",
      description: "",
    });
    setFormError(null);
    setShowCreate(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);
      await api.post("/invoices/", {
        patient_id: form.patient_id,
        amount: parseFloat(form.amount),
        description: form.description.trim(),
      });
      setShowCreate(false);
      toast("Invoice created successfully");
      await fetchData();
    } catch (err) {
      setFormError(err.message || "Failed to create invoice");
    } finally {
      setFormLoading(false);
    }
  }

  async function markPaid(invoice) {
    try {
      await api.patch(`/invoices/${invoice.id}`, { status: "paid" });
      toast("Invoice marked as paid");
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to mark invoice as paid", "error");
    }
  }

  function handlePrint(invoice) {
    setPrintingInvoice(invoice);
    setTimeout(() => {
      window.print();
      setPrintingInvoice(null);
    }, 100);
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Invoices</h1>
        </div>
        <div className={styles.card}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} columns={7} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (printingInvoice && user) {
    const patient = getPatient(printingInvoice.patient_id);
    return (
      <div className={styles.printContainer}>
        <div className={styles.printHeader}>
          <div>
            <h1 className={styles.printClinicName}>{user.clinic_name || `Dr. ${user.first_name} ${user.last_name}`}</h1>
            {user.clinic_address && <p className={styles.printText}>{user.clinic_address}</p>}
            {user.brn_number && <p className={styles.printText}>BRN/VAT: {user.brn_number}</p>}
            {user.phone && <p className={styles.printText}>Phone: {user.phone}</p>}
            {user.email && <p className={styles.printText}>Email: {user.email}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 className={styles.printTitle}>INVOICE</h2>
            <p className={styles.printText}><strong>Invoice #:</strong> {printingInvoice.invoice_number}</p>
            <p className={styles.printText}><strong>Date:</strong> {formatDate(printingInvoice.created_at)}</p>
            <p className={styles.printText}><strong>Status:</strong> {printingInvoice.status.toUpperCase()}</p>
          </div>
        </div>

        <div className={styles.printBillTo}>
          <h3 className={styles.printSectionTitle}>Bill To:</h3>
          <p className={styles.printText}><strong>{patient?.first_name} {patient?.last_name}</strong></p>
          <p className={styles.printText}>{patient?.phone}</p>
        </div>

        <table className={styles.printTable}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{printingInvoice.description || "Medical Consultation"}</td>
              <td style={{ textAlign: "right" }}>{formatCurrency(printingInvoice.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div className={styles.printTotal}>
          <p><strong>Total Due:</strong> {formatCurrency(printingInvoice.amount)}</p>
        </div>

        {user.invoice_notes && (
          <div className={styles.printNotes}>
            <h3 className={styles.printSectionTitle}>Notes / Payment Terms:</h3>
            <p className={styles.printText}>{user.invoice_notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${printingInvoice ? styles.hideForPrint : ""}`}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Invoices</h1>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      <div className={styles.card}>
        {invoices.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>No invoices yet. Create your first invoice.</div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const patient = getPatient(inv.patient_id);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: "600", color: "var(--gray-900)" }}>
                      {inv.invoice_number || `INV-${inv.id.substring(0, 6)}`}
                    </td>
                    <td>{patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${inv.patient_id}`}</td>
                    <td className={styles.amount}>
                      {formatCurrency(inv.amount)}
                    </td>
                    <td>{formatDate(inv.created_at || inv.date)}</td>
                    <td>{inv.description || "—"}</td>
                    <td>
                      <StatusBadge status={inv.status || "draft"} />
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {inv.status !== "paid" && inv.status !== "cancelled" && (
                          <button
                            className={styles.btnAction}
                            onClick={() => markPaid(inv)}
                            title="Mark as paid"
                          >
                            <CheckCircle2 size={14} />
                            Paid
                          </button>
                        )}
                        <button
                          className={styles.btnActionSecondary}
                          onClick={() => handlePrint(inv)}
                          title="Print / PDF"
                        >
                          <Printer size={14} />
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className={styles.overlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create Invoice</h2>
            <form className={styles.form} onSubmit={handleCreate}>
              <div className={styles.field}>
                <label className={styles.label}>Patient</label>
                <select
                  className={styles.select}
                  value={form.patient_id}
                  onChange={(e) =>
                    setForm({ ...form, patient_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Amount (MUR)</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Consultation, lab tests, etc."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              {formError && <p className={styles.formError}>{formError}</p>}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={formLoading}
                >
                  {formLoading ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
