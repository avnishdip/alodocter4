-- Initial schema for Alo Doctor BaaS
-- Enables Row Level Security (RLS) for all tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'patient')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Doctors Table
CREATE TABLE doctors (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialty TEXT NOT NULL,
  license_no TEXT NOT NULL UNIQUE,
  bio TEXT,
  fee INTEGER NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_name TEXT,
  invoice_address TEXT,
  invoice_brn TEXT,
  invoice_tan TEXT,
  invoice_instructions TEXT
);

-- 3. Patients Table
CREATE TABLE patients (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  date_of_birth DATE NOT NULL,
  medical_conditions TEXT,
  pin_hash TEXT,
  invite_token TEXT UNIQUE
);

-- 4. Doctor_Patients mapping (Relationships)
CREATE TABLE doctor_patients (
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (doctor_id, patient_id)
);

-- 5. Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Medication Plans
CREATE TABLE medication_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times_per_day INTEGER NOT NULL,
  schedule JSONB NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Medication Logs
CREATE TABLE medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES medication_plans(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'taken', 'missed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 8. Availability Table
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week)
);

-- 9. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to handle new user signups via Supabase Auth

-- 10. Pending Invites
CREATE TABLE IF NOT EXISTS pending_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  conditions TEXT,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doctor_id, phone)
);
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can manage invites" ON pending_invites FOR ALL USING (auth.uid() = doctor_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
DECLARE
  invite_record RECORD;
BEGIN
  -- Check if this phone number was invited
  SELECT * INTO invite_record FROM public.pending_invites WHERE phone = new.phone LIMIT 1;

  INSERT INTO public.profiles (id, role, first_name, last_name, phone)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'patient'), 
    COALESCE(new.raw_user_meta_data->>'first_name', COALESCE(invite_record.first_name, '')), 
    COALESCE(new.raw_user_meta_data->>'last_name', COALESCE(invite_record.last_name, '')),
    new.phone
  );
  
  IF COALESCE(new.raw_user_meta_data->>'role', 'patient') = 'doctor' THEN
    INSERT INTO public.doctors (id, specialty, license_no, fee)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'specialty', 'General Practice'),
      COALESCE(new.raw_user_meta_data->>'license_no', 'PENDING'),
      COALESCE((new.raw_user_meta_data->>'fee')::int, 0)
    );
  ELSE
    INSERT INTO public.patients (id, date_of_birth, medical_conditions)
    VALUES (new.id, '1990-01-01', COALESCE(invite_record.conditions, ''));

    IF invite_record.doctor_id IS NOT NULL THEN
      INSERT INTO public.doctor_patients (doctor_id, patient_id) VALUES (invite_record.doctor_id, new.id);
      DELETE FROM public.pending_invites WHERE id = invite_record.id;
    END IF;
  END IF;

  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile. Everyone can read doctors (needed for booking).
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Anyone can view doctor profiles" ON profiles FOR SELECT USING (role = 'doctor');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Doctors: Anyone can view public doctors. Doctors can update their own info.
CREATE POLICY "Anyone can view doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update their own info" ON doctors FOR UPDATE USING (auth.uid() = id);

-- Patients: Patients view themselves. Doctors view their assigned patients.
CREATE POLICY "Patients view own info" ON patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Doctors view assigned patients" ON patients FOR SELECT USING (
  EXISTS (SELECT 1 FROM doctor_patients dp WHERE dp.patient_id = patients.id AND dp.doctor_id = auth.uid())
);
CREATE POLICY "patients_update_own" ON patients FOR UPDATE USING (auth.uid() = id);

-- Doctor_Patients: Both doctors and patients can view their relationships.
CREATE POLICY "View own relationships" ON doctor_patients FOR SELECT USING (doctor_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Doctors can link patients" ON doctor_patients FOR INSERT WITH CHECK (doctor_id = auth.uid());

-- Appointments: Doctors and patients can view/update their own appointments.
CREATE POLICY "View own appointments" ON appointments FOR SELECT USING (doctor_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Insert own appointments" ON appointments FOR INSERT WITH CHECK (patient_id = auth.uid() OR doctor_id = auth.uid());
CREATE POLICY "Update own appointments" ON appointments FOR UPDATE USING (doctor_id = auth.uid() OR patient_id = auth.uid());

-- Medication Plans & Logs
CREATE POLICY "View own meds" ON medication_plans FOR SELECT USING (doctor_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Doctors can create meds" ON medication_plans FOR INSERT WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "View own logs" ON medication_logs FOR SELECT USING (patient_id = auth.uid() OR EXISTS(SELECT 1 FROM medication_plans mp WHERE mp.id = plan_id AND mp.doctor_id = auth.uid()));
CREATE POLICY "medication_logs_insert_own" ON medication_logs FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients update logs" ON medication_logs FOR UPDATE USING (patient_id = auth.uid());



ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Availability Policies
CREATE POLICY "Public can view availability" ON availability FOR SELECT USING (true);
CREATE POLICY "Doctors update own availability" ON availability FOR ALL USING (auth.uid() = doctor_id);

-- Invoices Policies
CREATE POLICY "View own invoices" ON invoices FOR SELECT USING (doctor_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Doctors create invoices" ON invoices FOR INSERT WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Doctors update invoices" ON invoices FOR UPDATE USING (doctor_id = auth.uid());


-- SECURITY HOTFIX: Stricter Update/Insert Policies
-- Previously, some tables allowed users to insert/update rows without strictly bounding all sensitive columns

-- Appointments: Doctors and patients can view/update their own appointments.
DROP POLICY IF EXISTS "Update own appointments" ON appointments;
CREATE POLICY "Update own appointments" ON appointments FOR UPDATE USING (doctor_id = auth.uid() OR patient_id = auth.uid()) WITH CHECK (doctor_id = auth.uid() OR patient_id = auth.uid());

-- Medication Plans: Only doctors should be able to update active status
DROP POLICY IF EXISTS "Doctors can update meds" ON medication_plans;
CREATE POLICY "Doctors can update meds" ON medication_plans FOR UPDATE USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());

-- Profiles: Ensure users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Doctors: Ensure doctors can only update their own doctor info
DROP POLICY IF EXISTS "Doctors can update their own info" ON doctors;
CREATE POLICY "Doctors can update their own info" ON doctors FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Doctor_Patients: Only doctors can delete relationships
DROP POLICY IF EXISTS "Doctors can delete relationships" ON doctor_patients;
CREATE POLICY "Doctors can delete relationships" ON doctor_patients FOR DELETE USING (doctor_id = auth.uid());

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
