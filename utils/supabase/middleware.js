import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Basic route protection — redirect unauthenticated users to login
  if (
    !user &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/join") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/search") &&
    !pathname.startsWith("/d") &&
    !pathname.startsWith("/terms") &&
    !pathname.startsWith("/privacy") &&
    !pathname.startsWith("/forgot-password") &&
    !pathname.startsWith("/reset-password") &&
    !pathname.startsWith("/verification-complete") &&
    pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role enforcement — prevent cross-role access to protected routes
  if (user && (pathname.startsWith("/doctor") || pathname.startsWith("/patient"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      const url = request.nextUrl.clone();

      if (pathname.startsWith("/doctor") && profile.role !== "doctor") {
        url.pathname = "/patient/home";
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/patient") && profile.role !== "patient") {
        url.pathname = "/doctor/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
