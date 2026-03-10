-- Performance indexes for common query patterns

-- appointments: most queried by doctor_id, patient_id, date
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- medication_plans: queried by doctor_id, patient_id
CREATE INDEX IF NOT EXISTS idx_medication_plans_doctor_id ON medication_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medication_plans_patient_id ON medication_plans(patient_id);

-- medication_logs: queried by patient_id, plan_id
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient_id ON medication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_plan_id ON medication_logs(plan_id);

-- invoices: queried by doctor_id, patient_id
CREATE INDEX IF NOT EXISTS idx_invoices_doctor_id ON invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);

-- doctor_patients: queried by doctor_id
CREATE INDEX IF NOT EXISTS idx_doctor_patients_doctor_id ON doctor_patients(doctor_id);

-- availability: queried by doctor_id
CREATE INDEX IF NOT EXISTS idx_availability_doctor_id ON availability(doctor_id);

-- pending_invites: queried by doctor_id and phone
CREATE INDEX IF NOT EXISTS idx_pending_invites_doctor_id ON pending_invites(doctor_id);
CREATE INDEX IF NOT EXISTS idx_pending_invites_phone ON pending_invites(phone);
