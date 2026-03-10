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
      const id = pathArray[2];
      const { data } = await supabase.from("availability").select("*").eq("doctor_id", id);
      return NextResponse.json(data || []);
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
      const { data: invites } = await supabase.from("pending_invites").select("*").eq("doctor_id", user.id);
      const active = data?.map(d => ({ ...d.patients, ...d.patients?.profiles, status: "active" })) || [];
      const pending = invites?.map(i => ({ id: i.id, first_name: i.first_name, last_name: i.last_name, phone: i.phone, status: "invited" })) || [];
      return NextResponse.json([...active, ...pending]);
    }

    if (path.startsWith("patients/") && pathArray.length === 2 && pathArray[1] !== "me") {
      const { data } = await supabase.from("patients").select("*, profiles(*)").eq("id", pathArray[1]).single();
      return NextResponse.json({ ...data, ...data?.profiles });
    }


    if (path === "appointments" || path === "appointments/") {
      const { data } = await supabase.from("appointments").select("*, doctors(profiles(*)), patients(profiles(*))").or(`doctor_id.eq.${user.id},patient_id.eq.${user.id}`);

      return NextResponse.json(data?.map(d => ({
        ...d,
        datetime: `${d.date}T${d.start_time}`,
        doctor: d.doctors ? { ...d.doctors, ...d.doctors.profiles } : null,
        patient: d.patients ? { ...d.patients, ...d.patients.profiles } : null
      })) || []);

    }

    if (path === "appointments/available-slots") {
      const searchParams = request.nextUrl.searchParams;
      const doctorId = searchParams.get("doctor_id");
      const dateStr = searchParams.get("date");
      if (!doctorId || !dateStr) return NextResponse.json({ slots: [] });

      const dateObj = new Date(dateStr);
      const jsDay = dateObj.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to DB convention: 0=Monday, ..., 6=Sunday
      
      // Fetch availability for that day
      const { data: avail } = await supabase.from("availability").select("*").eq("doctor_id", doctorId).eq("day_of_week", dayOfWeek).single();
      
      if (!avail) return NextResponse.json({ slots: [] });
      
      // Fetch existing appointments
      const { data: appointments } = await supabase.from("appointments").select("start_time, end_time").eq("doctor_id", doctorId).eq("date", dateStr).neq("status", "cancelled");
      
      // Generate slots
      const slots = [];
      let currentString = avail.start_time; // e.g. "09:00:00"
      const endString = avail.end_time;
      const duration = avail.slot_duration || 30;
      
      const parseTime = (t) => {
        const [h, m] = t.split(':');
        return parseInt(h, 10) * 60 + parseInt(m, 10);
      };
      const formatTime = (mins) => {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
      };

      let currentMins = parseTime(currentString);
      const endMins = parseTime(endString);
      
      const bookedSet = new Set(appointments?.map(a => formatTime(parseTime(a.start_time))) || []);

      while (currentMins + duration <= endMins) {
        const slotStr = formatTime(currentMins);
        if (!bookedSet.has(slotStr)) {
          slots.push(slotStr);
        }
        currentMins += duration;
      }
      
      return NextResponse.json({ slots });
    }



    if (path === "medications/logs") {
      const { data } = await supabase.from("medication_logs").select("*").eq("patient_id", user.id);
      return NextResponse.json(data || []);
    }

    if (path === "medications/plans") {
      const { data } = await supabase.from("medication_plans").select("*").or(`doctor_id.eq.${user.id},patient_id.eq.${user.id}`);
      return NextResponse.json(data?.map(p => ({...p, times: p.schedule, active: p.is_active, medication_name: p.name})) || []);
    }

    if (path.startsWith("medications/plans/patient/")) {
      const { data } = await supabase.from("medication_plans").select("*").eq("patient_id", pathArray[3]);
      return NextResponse.json(data?.map(p => ({...p, times: p.schedule, active: p.is_active, medication_name: p.name})) || []);
    }

    if (path.startsWith("medications/compliance/")) {
      const patientId = pathArray[2];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: logs } = await supabase.from("medication_logs").select("status").eq("patient_id", patientId).gte("created_at", thirtyDaysAgo);
      const total = logs?.length || 0;
      const taken = logs?.filter(l => l.status === "taken").length || 0;
      const score = total === 0 ? 100 : Math.round((taken / total) * 100);
      const { count: totalPrescriptions } = await supabase.from("medication_plans").select("id", { count: "exact", head: true }).eq("patient_id", patientId);
      return NextResponse.json({ score, taken, total, total_prescriptions: totalPrescriptions || 0 });
    }

    if (path === "invoices" || path === "invoices/") {
      const { data } = await supabase.from("invoices").select("*, patients(profiles(first_name, last_name)), doctors(profiles(first_name, last_name))").or(`doctor_id.eq.${user.id},patient_id.eq.${user.id}`);
      return NextResponse.json(data?.map(i => ({...i, patient_name: i.patients?.profiles?.first_name + ' ' + i.patients?.profiles?.last_name, doctor_name: i.doctors?.profiles?.first_name + ' ' + i.doctors?.profiles?.last_name})) || []);
    }

    if (path === "doctors/me/availability") {
      const { data } = await supabase.from("availability").select("*").eq("doctor_id", user.id);
      return NextResponse.json(data || []);
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
      if (body.first_name || body.last_name || body.phone) { await supabase.from("profiles").update({ first_name: body.first_name, last_name: body.last_name, phone: body.phone }).eq("id", user.id); }
      await supabase.from("doctors").update({ specialty: body.specialty, license_no: body.license_no, fee: body.fee || 0 }).eq("id", user.id);
      return NextResponse.json({ role: "doctor", user: { id: user.id, email: user.email }});
    }


    if (path === "patients/invite") {
      const token = Math.random().toString(36).substring(2, 10);
      let p_phone = body.phone.startsWith("+") ? body.phone : `+230${body.phone}`;
      const { data, error } = await supabase.from("pending_invites").upsert({
        doctor_id: user.id,
        phone: p_phone,
        first_name: body.first_name,
        last_name: body.last_name,
        conditions: body.conditions ? body.conditions.join(", ") : "",
        token: token
      }).select().single();
      if (error) throw error;
      // Send them to the normal login screen instead of the old legacy PIN screen
      return NextResponse.json({ invite_link: `https://${request.headers.get("host")}/login?redirect=patient` });
    }

    if (path === "auth/sync-patient") {
      if (!user) return NextResponse.json({}, { status: 401 });
      await supabase.from("profiles").update({ first_name: body.first_name, last_name: body.last_name }).eq("id", user.id);
      await supabase.from("patients").update({ date_of_birth: body.date_of_birth || "1990-01-01" }).eq("id", user.id);

      // Auto-link patient to doctor if there's a pending invite for this phone
      const userPhone = user.phone;
      if (userPhone) {
        const normalizedPhone = userPhone.startsWith('+') ? userPhone : `+230${userPhone}`;
        const { data: invite } = await supabase
          .from('pending_invites')
          .select('*')
          .eq('phone', normalizedPhone)
          .single();

        if (invite) {
          // Link patient to doctor
          await supabase.from('doctor_patients').upsert({
            doctor_id: invite.doctor_id,
            patient_id: user.id
          });
          // Delete the pending invite
          await supabase.from('pending_invites').delete().eq('id', invite.id);
          // Pre-fill patient conditions from invite if present
          if (invite.conditions) {
            await supabase.from('patients').update({
              medical_conditions: invite.conditions
            }).eq('id', user.id);
          }
        }
      }

      return NextResponse.json({ role: "patient", user: { id: user.id, phone: user.phone }});
    }

    if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });


    if (path === "appointments" || path === "appointments/") {
      let date = body.date;
      let start_time = body.start_time;
      let end_time = body.end_time;
      
      // Handle the case where frontend sends 'datetime'
      if (body.datetime) {
         const dt = new Date(body.datetime);
         date = dt.toISOString().split("T")[0];
         start_time = dt.toISOString().split("T")[1].substring(0, 5); // 'HH:MM' in UTC
         // wait, timezone matters. The frontend sends local time. 
         // Actually, the simplest is just extract from ISO if we want UTC, or use dt.getHours()
         const hh = dt.getHours().toString().padStart(2, '0');
         const mm = dt.getMinutes().toString().padStart(2, '0');
         start_time = `${hh}:${mm}`;
         dt.setMinutes(dt.getMinutes() + 30);
         const ehh = dt.getHours().toString().padStart(2, '0');
         const emm = dt.getMinutes().toString().padStart(2, '0');
         end_time = `${ehh}:${emm}`;
      }

      const { data, error } = await supabase.from("appointments").insert({
        doctor_id: body.doctor_id || user.id,
        patient_id: body.patient_id || user.id,
        date: date,
        start_time: start_time,
        end_time: end_time || start_time,
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
        times_per_day: body.times?.length || body.times_per_day || 1,
        schedule: body.times || body.schedule || {},
        start_date: body.start_date || new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }


    if (path === "medications/logs") {
      const { data, error } = await supabase.from("medication_logs").insert({
        plan_id: body.plan_id,
        patient_id: user.id,
        scheduled_time: body.scheduled_at,
        taken_at: body.status === 'taken' ? new Date().toISOString() : null,
        status: body.status
      }).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (path === "invoices" || path === "invoices/") {
      const { data, error } = await supabase.from("invoices").insert({
        doctor_id: user.id,
        patient_id: body.patient_id,
        amount: body.amount,
        description: body.description || body.notes,
        status: "unpaid",
        due_date: body.due_date,
        appointment_id: body.appointment_id || null
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
      const { data } = await supabase.from("doctors").update({ specialty: body.specialty, bio: body.bio, fee: body.fee, is_public: body.is_public, invoice_name: body.invoice_name, invoice_address: body.invoice_address, invoice_brn: body.invoice_brn, invoice_tan: body.invoice_tan, invoice_instructions: body.invoice_instructions }).eq("id", user.id).select().single() || {};
      return NextResponse.json(data);
    }
    
    if (path === "patients/me") {
       await supabase.from("profiles").update({ first_name: body.first_name, last_name: body.last_name }).eq("id", user.id);
       const { data } = await supabase.from("patients").update({ medical_conditions: body.medical_conditions }).eq("id", user.id).select().single();
       return NextResponse.json(data);
    }

    if (path === "doctors/me/availability") {
      // Upsert availability
      await supabase.from("availability").delete().eq("doctor_id", user.id);
      if (body && body.length > 0) {
        const slots = body.map(s => ({...s, doctor_id: user.id}));
        await supabase.from("availability").insert(slots);
      }
      return NextResponse.json({ success: true });
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

     if (path.startsWith("invoices/") && p.path.length === 2) {
       const invoiceId = p.path[1];
       const updateFields = {};
       if (body.status !== undefined) updateFields.status = body.status;
       if (body.status === "paid") updateFields.paid_at = new Date().toISOString();
       const { data, error } = await supabase.from("invoices").update(updateFields).eq("id", invoiceId).eq("doctor_id", user.id).select().single();
       if (error) throw error;
       return NextResponse.json(data);
     }

     if (path.startsWith("medications/plans/") && p.path.length === 3) {
       const planId = p.path[2];
       const updateFields = {};
       if (body.name !== undefined) updateFields.name = body.name;
       if (body.dosage !== undefined) updateFields.dosage = body.dosage;
       if (body.frequency !== undefined) updateFields.frequency = body.frequency;
       if (body.schedule !== undefined) updateFields.schedule = body.schedule;
       if (body.is_active !== undefined) updateFields.is_active = body.is_active;
       if (body.times_per_day !== undefined) updateFields.times_per_day = body.times_per_day;
       const { data, error } = await supabase.from("medication_plans").update(updateFields).eq("id", planId).eq("doctor_id", user.id).select().single();
       if (error) throw error;
       return NextResponse.json(data);
     }

     return NextResponse.json({}, { status: 404 });
   } catch (err) {
     return NextResponse.json({ detail: err.message }, { status: 500 });
   }
}

export async function DELETE(request, { params }) {
  const p = await params;
  const pathArray = p.path || [];
  const path = pathArray.join("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  try {
    if (path.startsWith("medications/plans/") && pathArray.length === 3) {
      const planId = pathArray[2];
      const { error } = await supabase.from("medication_plans").delete().eq("id", planId).eq("doctor_id", user.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ detail: "Not found DELETE: " + path }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
