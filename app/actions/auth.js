"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const { error, data: authData } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  revalidatePath("/", "layout");
  
  if (profile?.role === "doctor") {
    redirect("/doctor/dashboard");
  } else {
    redirect("/patient/medications");
  }
}

export async function signup(formData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    options: {
      data: {
        role: "doctor",
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        specialty: formData.get("specialty"),
        license_no: formData.get("license_no"),
        fee: parseInt(formData.get("fee") || "0", 10)
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/verification-complete");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
