import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      accessToken: null,

      registerDoctor: async (data) => {
        const { email, password, ...profileData } = data;
        
        // 1. Sign up with Supabase
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Wait for session to establish
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
           throw new Error("Please verify your email address before continuing.");
        }

        // 2. Sync profile with our backend
        const res = await api.post("/auth/sync-doctor", profileData);
        set({ user: res.user, role: res.role, isAuthenticated: true, accessToken: sessionData.session.access_token });
        return res.user;
      },

      loginDoctor: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;

        // Fetch profile from our backend
        const res = await api.get("/auth/me");
        if (res.status === "incomplete") {
            throw new Error("Profile incomplete. Please finish onboarding.");
        }
        
        set({ user: res.user, role: res.role, isAuthenticated: true, accessToken: data.session.access_token });
        return res.user;
      },

      requestOTP: async (phone) => {
        // Assume phone includes +230
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone.startsWith('+') ? phone : `+230${phone}`,
        });
        if (error) throw error;
      },

      verifyOTP: async (phone, otp) => {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: phone.startsWith('+') ? phone : `+230${phone}`,
          token: otp,
          type: 'sms',
        });
        
        if (error) throw error;

        // Try to fetch existing profile
        const res = await api.get("/auth/me");
        
        if (res.status === "incomplete") {
            // New patient, auto-sync a basic profile
            const syncRes = await api.post("/auth/sync-patient", {
                first_name: "New",
                last_name: "Patient"
            });
            set({ user: syncRes.user, role: syncRes.role, isAuthenticated: true, accessToken: data.session.access_token });
            return syncRes.user;
        }

        set({ user: res.user, role: res.role, isAuthenticated: true, accessToken: data.session.access_token });
        return res.user;
      },

      // Keep for legacy compatibility if needed
      loginPatient: async (phone, pin) => {
        throw new Error("PIN login has been disabled. Please use OTP.");
      },

      setAuth: (user, role, accessToken) => set({ user, role, isAuthenticated: true, accessToken }),

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore errors
        }
        set({ user: null, role: null, isAuthenticated: false, accessToken: null });
      },

      updateUser: (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },
    }),
    {
      name: "alo_auth",
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        // We do not persist the accessToken, Supabase manages session persistence internally
      }),
    }
  )
);
