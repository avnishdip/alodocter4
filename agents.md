# Agents Activity Log

## Session 2026-03-11: MVP Phase A + B

### Skill: superpowers:subagent-driven-development
- Used for: Orchestrating 9 parallel/sequential implementation tasks with spec + quality review after each
- Accomplished: Full Phase A + B execution with two-stage review per task
- Pattern: Fresh subagent per task prevents context pollution across fixes

### Skill: superpowers:using-git-worktrees
- Used for: Isolated workspace on `feature/mvp-phase-a-b`
- Accomplished: Created `.worktrees/mvp-phase-a-b`, added `.worktrees/` to `.gitignore` (was missing)
- Learning: Always run `git check-ignore` before creating project-local worktree

### Agent: implementer-task1-api-endpoints (general-purpose)
- Used for: Adding POST /invoices, PATCH /invoices/:id, PATCH /medications/plans/:id, DELETE /medications/plans/:id, real compliance calculation
- Accomplished: All 5 endpoints added and compiled successfully
- Note: Left unused `data` variable in patients/invite (caught by diagnostics, fixed later)

### Agent: implementer-task2-rls-policies (general-purpose)
- Used for: Adding missing RLS policies to schema and migration file
- Accomplished: Found schema.sql in `supabase/schema.sql`; created migration `20260311000000_fix_rls_policies.sql`; added policies to schema.sql for fresh setups
- Learning: `invoices` already had an UPDATE policy — migration creates a duplicate (harmless but notable)

### Agent: implementer-task3-data-bugs (general-purpose)
- Used for: Fixing 4 data bugs (appointment_type, conditions parsing, doctor profile save, day_of_week)
- Accomplished: All 4 fixed; verified actual schema columns (doctor table has `invoice_name` etc, not `clinic_name`)
- Learning: Always read schema before writing field names to update queries

### Agent: implementer-task4-password-reset (general-purpose)
- Used for: Building forgot-password and reset-password pages
- Accomplished: Two new pages created, "Forgot password?" link added to login (doctor tab only)
- Pattern: Reused existing `login.module.css` for styling consistency

### Agent: implementer-task5-invite-flow (general-purpose)
- Used for: Removing broken /join/[token] and adding patient auto-link on OTP login
- Accomplished: Deleted join page + CSS, added auto-link logic in auth/sync-patient handler
- Learning: The auto-link fires during `auth/sync-patient` which is called from authStore.verifyOTP on first patient login

### Agent: implementer-task6-css-variables (general-purpose)
- Used for: Defining 40 missing CSS custom properties in tokens.css
- Accomplished: All variables defined; verified zero undefined vars remain in CSS files

### Agent: implementer-task7-nav-navigation (general-purpose)
- Used for: Nav active state fix and window.location.href → router.push replacements
- Accomplished: 3 files updated with router.push; nav uses startsWith
- Issue: Added `useRouter` imports but some replacements didn't apply → caused unused import diagnostics; fixed in follow-up

### Agent: fix-router-unused (general-purpose)
- Used for: Cleaning up unused imports left by task7
- Accomplished: Removed `todayCount`, `SkipForward` unused vars; fixed route.js unused `data`/`request` params
- Learning: After adding router imports, verify actual window.location.href calls still exist in the file

### Agent: implementer-task8-db-indexes-api-errors (general-purpose)
- Used for: DB indexes migration and API error sanitization
- Accomplished: 14 indexes created in migration + schema.sql; all 5 catch blocks sanitized

### Agent: implementer-task9-dead-code (general-purpose)
- Used for: Removing unused components, files, imports
- Accomplished: 10 components deleted, 3 files deleted, dev.log removed, unused imports cleaned
- Pattern: Always grep for imports before deleting a component

### Agent: final-reviewer (general-purpose)
- Used for: Full code review of all changes
- Verdict: APPROVED WITH MINOR RESERVATIONS
- Critical issues found:
  1. `patients/invite` missing auth guard before the global guard + `body.phone` null crash → fixed
  2. `PATCH /appointments/:id` unbounded mass-assignment → fixed with field whitelist
- Minor issues noted: patients UPDATE RLS missing WITH CHECK, duplicate invoices UPDATE policy, compliance defaults to 100 with no logs

### Tool Patterns Discovered
- **Diagnostic-driven iteration**: TypeScript diagnostics in the system-reminder after each commit revealed unused imports that needed follow-up fixes (3 rounds)
- **Schema-first for field names**: Agents that read schema.sql before writing field names to queries produced correct code; agents that assumed field names from the plan description were wrong
- **Worktree build proxy**: No test suite → `npm run build | grep Compiled` as verification gate
- **Handler order matters**: POST route.js has auth guards scattered per-handler before the global guard — new handlers added before the global guard need their own `if (!user)` check
