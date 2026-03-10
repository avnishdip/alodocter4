# Alo Doctor — Claude Session Notes

**Project**: Next.js 16 + Supabase medical platform for Mauritius
**Stack**: Next.js App Router, Supabase (auth + DB + RLS), Zustand (auth store), CSS Modules
**Last Updated**: 2026-03-11

---

## Session 2026-03-11: MVP Phase A + B Audit & Fixes

### Overview
Full platform audit followed by execution of Phase A (critical bugs) and Phase B (polish). 34 files changed, net -334 lines (leaner codebase).

### Decisions Made

- **Catch-all API route pattern**: All API endpoints live in `app/api/[[...path]]/route.js` as a single file. Do not create separate route files — extend this file for new endpoints.
- **No test suite**: Project has no `npm test` script. Use `npm run build` (compilation check) as the proxy for test verification.
- **Worktree location**: Used `.worktrees/` (project-local, gitignored) for isolated feature branch work.
- **Patient invite flow**: Removed the broken `/join/[token]` PIN-based page. Current flow: doctor sends invite link → patient goes to `/login?redirect=patient` → OTP login → `auth/sync-patient` auto-links patient to doctor via `pending_invites` table.
- **Appointment PATCH field whitelist**: Only `status`, `notes`, `type` are allowed in appointment updates. Rationale: previous unbounded `body` pass-through allowed potential field tampering (doctor_id/patient_id reassignment).
- **API error sanitization**: All `catch` blocks return `{ detail: 'An error occurred' }` + `console.error` internally. Never expose raw Supabase/SQL error messages to clients.
- **Day-of-week convention**: DB stores 0=Monday, 6=Sunday. JavaScript `Date.getDay()` returns 0=Sunday. Conversion: `jsDay === 0 ? 6 : jsDay - 1`.

### Code Changes

#### New Files
- `app/forgot-password/page.js` — Email form → `supabase.auth.resetPasswordForEmail()`. Status: completed.
- `app/reset-password/page.js` — Validates session token on mount → `supabase.auth.updateUser({ password })`. Status: completed.
- `supabase/migrations/20260311000000_fix_rls_policies.sql` — Adds missing RLS policies. Status: completed.
- `supabase/migrations/20260311000001_add_indexes.sql` — 14 FK indexes for common query patterns. Status: completed.

#### Modified Files
- `app/api/[[...path]]/route.js` — Added POST /invoices, PATCH /invoices/:id, PATCH /medications/plans/:id, DELETE handler for medication plans, real compliance calculation, auth guard on patients/invite, appointment field whitelist, sanitized error responses.
- `app/tokens.css` — Defined 40 missing CSS custom properties (`--primary`, `--navy`, `--text-primary`, etc.).
- `app/doctor/layout.js` — Nav active state changed from `===` to `startsWith` for sub-page highlighting.
- `app/doctor/appointments/page.js` — Fixed `apt.appointment_type` → `apt.type`.
- `app/doctor/patients/page.js` — Fixed `conditions.map()` crash: parse string before mapping.
- `app/doctor/dashboard/page.js`, `app/doctor/patients/[id]/page.js`, `app/patient/home/page.js` — Replaced `window.location.href` with `router.push()`.
- `app/login/page.js` — Added "Forgot password?" link (doctor tab only).
- `lib/stores/authStore.js` — Removed unused `loginPatient` stub, fixed unused `authData` destructuring.
- `supabase/schema.sql` — Added missing RLS policies and 14 indexes inline for fresh setups.

#### Deleted Files
- `app/join/[token]/page.js` + CSS — Dead code (PIN auth, nonexistent API endpoints).
- `app/actions/auth.js` — Unused server actions file.
- `lib/constants.js` — All exports were unused.
- `dev.log` — Committed log file removed; `*.log` added to `.gitignore`.
- 10 unused UI components: `EmptyState`, `Tabs`, `DaySelector`, `TimeSlotPicker`, `BackButton`, `IconButton`, `PageTransition`, `DoctorDodoEmpty`, `DoctorDodoHero`, `DoctorDodoSuccess`.

### Learnings

- **`patients/invite` was before the global auth guard**: The POST handler order matters — `patients/invite` and `auth/sync-*` are before the `if (!user) return 401` guard. Each needs its own auth check.
- **`conditions` field**: Stored as comma-separated string in DB (`medical_conditions`), not an array. Frontend must split before `.map()`.
- **Doctor profile columns**: The actual columns on the `doctors` table are `invoice_name`, `invoice_address`, `invoice_brn`, `invoice_tan`, `invoice_instructions` — NOT `clinic_name`, `invoice_prefix`, `invoice_notes` (plan was wrong, code checked schema).
- **`invoices` already had an UPDATE RLS policy** (`"Doctors update invoices"` in schema). The migration adds a second one — harmless (OR semantics) but worth consolidating if schema is reset.
- **Compliance was hardcoded** at `{ score: 85 }` — now real calculation from `medication_logs` over rolling 30-day window.
- **`useRouter` + `router` can be unused if window.location.href calls were already removed** by prior work — always verify the actual replacements exist after adding the import.

---

## Pending (Phase C+)

- Real compliance tracking UI (charts/trends) — backend calculation now exists
- Notification system (appointment + medication reminders via Supabase Edge Functions)
- Dashboard analytics charts (recharts)
- Telemedicine video calls (Daily.co or Jitsi)
- AI clinical assistant (visit notes, drug interactions via Claude API)
- E-prescriptions with QR codes
- MCB Juice payment integration
- Responsive doctor layout (currently breaks below 1024px)
- Role enforcement in middleware (patients can access /doctor/* server-side)
- Accessibility improvements (aria-label, role="dialog", escape key on modals)
