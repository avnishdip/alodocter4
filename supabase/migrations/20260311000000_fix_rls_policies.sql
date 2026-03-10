-- Fix missing RLS policies for MVP

-- 1. patients UPDATE policy (allows patients to update their own record)
DROP POLICY IF EXISTS "patients_update_own" ON patients;
CREATE POLICY "patients_update_own" ON patients
  FOR UPDATE USING (auth.uid() = id);

-- 2. medication_logs INSERT policy (allows patients to log their doses)
DROP POLICY IF EXISTS "medication_logs_insert_own" ON medication_logs;
CREATE POLICY "medication_logs_insert_own" ON medication_logs
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- 3. invoices UPDATE policy (allows doctors to update their invoices)
DROP POLICY IF EXISTS "invoices_update_own" ON invoices;
CREATE POLICY "invoices_update_own" ON invoices
  FOR UPDATE USING (auth.uid() = doctor_id);
