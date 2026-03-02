import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const p = await params;
  const pathArray = p.path || [];
  const path = pathArray.join("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    if (path === "doctors/public") {
      const { data } = await supabase.from("doctors").select("id, specialty, fee, is_public, profiles(first_name, last_name)").eq("is_public", true);
      return NextResponse.json(data?.map(d => ({ ...d, first_name: d.profiles?.first_name, last_name: d.profiles?.last_name })) || []);
    }
    
    if (path.startsWith("doctors/public/") && pathArray.length === 3 && pathArray[2] !== "availability") {
      const id = pathArray[2];
      const { data } = await supabase.from("doctors").select("id, specialty, fee, bio, profiles(first_name, last_name)").eq("id", id).single();
      if (!data) return NextResponse.json({}, { status: 404 });
      return NextResponse.json({ ...data, first_name: data.profiles?.first_name, last_name: data.profiles?.last_name });
    }

    if (path.startsWith("doctors/public/") && path.endsWith("/availability")) {
      return NextResponse.json([{ day_of_week: 1, start_time: "09:00", end_time: "17:00" }]);
    }

    if (path === "auth/me") {
      if (!user) return NextResponse.json({ detail: "Not auth" }, { status: 401 });
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!profile) return NextResponse.json({ status: "incomplete", sub: user.id, email: user.email, phone: user.phone });
      return NextResponse.json({ status: "complete", role: profile.role, user: { id: profile.id, first_name: profile.first_name, last_name: profile.last_name, email: user.email, phone: profile.phone }});
    }

    if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

    if (path === "doctors/me") {
      const { data } = await supabase.from("doctors").select("*, profiles(*)").eq("id", user.id).single();
      return NextResponse.json({ ...data, ...data?.profiles });
    }

    if (path === "patients/me") {
      const { data } = await supabase.from("patients").select("*, profiles(*)").eq("id", user.id).single();
      return NextResponse.json({ ...data, ...data?.profiles });
    }

    if (path === "patients" || path === "patients/") {
      const { data } = await supabase.from("doctor_patients").select("patients(*, profiles(*))").eq("doctor_id", user.id);
      return NextResponse.json(data?.map(d => ({ ...d.patients, ...d.patients?.profiles })) || []);
    }

    if (path.startsWith("patients/") && pathArray.length === 2 && pathArray[1] !== "me") {
      const { data } = await supabase.from("patients").select("*, profiles(*)").eq("id", pathArray[1]).single();
      return NextResponse.json({ ...data, ...data?.profiles });
    }

    if (path === "appointments" || path === "appointments/") {
      const { data } = await supabase.from("appointments").select("*, doctors(profiles(*)), patients(profiles(*))").or(`doctor_id.eq.${user.id},patient_id.eq.${user.id}`);
      return NextResponse.json(data?.map(d => ({
        ...d,
        doctor: d.doctors ? { ...d.doctors, ...d.doctors.profiles } : null,
        patient: d.patients ? { ...d.patients, ...d.patients.profiles } : null
      })) || []);
    }

    if (path === "medications/plans") {
      const { data } = await supabase.from("medication_plans").select("*").or(`doctor_id.eq.${user.id},patient_id.eq.${user.id}`);
      return NextResponse.json(data || []);
    }

    if (path.startsWith("medications/plans/patient/")) {
      const { data } = await supabase.from("medication_plans").select("*").eq("patient_id", pathArray[3]);
      return NextResponse.json(data || []);
    }

    if (path.startsWith("medications/compliance/")) {
      return NextResponse.json({ score: 85, total_prescriptions: 2 });
    }

    if (path === "invoices" || path === "invoices/") {
      return NextResponse.json([]);
    }

    if (path === "doctors/me/availability") {
      return NextResponse.json([]);
    }

    return NextResponse.json({ detail: "Not found: " + path }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const p = await params;
  const pathArray = p.path || [];
  const path = pathArray.join("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const body = await request.json().catch(() => ({}));

    if (path === "auth/sync-doctor") {
      if (!user) return NextResponse.json({}, { status: 401 });
      await supabase.from("profiles").upsert({ id: user.id, role: "doctor", first_name: body.first_name, last_name: body.last_name });
      await supabase.from("doctors").upsert({ id: user.id, specialty: body.specialty, license_no: body.license_no, fee: body.fee || 0 });
      return NextResponse.json({ role: "doctor", user: { id: user.id, email: user.email }});
    }

    if (path === "auth/sync-patient") {
      if (!user) return NextResponse.json({}, { status: 401 });
      await supabase.from("profiles").upsert({ id: user.id, role: "patient", first_name: body.first_name, last_name: body.last_name });
      await supabase.from("patients").upsert({ id: user.id, date_of_birth: body.date_of_birth || "1990-01-01" });
      return NextResponse.json({ role: "patient", user: { id: user.id, phone: user.phone }});
    }

    if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

    if (path === "appointments") {
      const { data, error } = await supabase.from("appointments").insert({
        doctor_id: body.doctor_id || user.id,
        patient_id: body.patient_id || user.id,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time || body.start_time,
        type: body.type || 'consultation',
        notes: body.notes
      }).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (path === "medications/plans") {
      const { data, error } = await supabase.from("medication_plans").insert({
        doctor_id: user.id,
        patient_id: body.patient_id,
        name: body.name,
        dosage: body.dosage,
        frequency: body.frequency,
        times_per_day: body.times_per_day || 1,
        schedule: body.schedule || {},
        start_date: body.start_date || new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ detail: "Not found POST: " + path }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const p = await params;
  const path = p.path?.join("/") || "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  try {
    if (path === "doctors/me") {
      await supabase.from("profiles").update({ first_name: body.first_name, last_name: body.last_name }).eq("id", user.id);
      const { data } = await supabase.from("doctors").update({ specialty: body.specialty, bio: body.bio, fee: body.fee }).eq("id", user.id).select().single();
      return NextResponse.json(data);
    }
    
    if (path === "patients/me") {
       await supabase.from("profiles").update({ first_name: body.first_name, last_name: body.last_name }).eq("id", user.id);
       const { data } = await supabase.from("patients").update({ medical_conditions: body.medical_conditions }).eq("id", user.id).select().single();
       return NextResponse.json(data);
    }

    return NextResponse.json({ detail: "Not found PUT" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
   const p = await params;
   const path = p.path?.join("/") || "";
   const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return NextResponse.json({}, { status: 401 });
   
   try {
     const body = await request.json().catch(() => ({}));
     if (path.startsWith("appointments/") && p.path.length === 2) {
       const { data } = await supabase.from("appointments").update(body).eq("id", p.path[1]).select().single();
       return NextResponse.json(data);
     }
     return NextResponse.json({}, { status: 404 });
   } catch (err) {
     return NextResponse.json({ detail: err.message }, { status: 500 });
   }
}
