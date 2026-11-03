# Phase 7 — implementation and verification

The dashboard now stores milestone ticks, notes, additions and deletions in the main persisted plan, revision-protected cloud snapshot and backup. Legacy browser-only checklists migrate only after verified reads; authoritative cloud tasks take precedence. Updated SQL preserves milestones when older clients omit the new field. Explicit column selection blocks writes against an outdated schema.

Guest management now combines people-based summaries, group/attendance/invitation/table filters, accent-insensitive contact search, detailed stable add/edit forms, table summaries and filtered CSV. Optional private fields retain phone, address, notes and table assignment. RSVP import preserves party size, phone, notes and source deduplication. Children are included in displayed total attendees. The mobile More sheet is unmounted when closed.

Verification: 70 tests in 12 files, 3 Chrome flows, typecheck/lint/build, preview helper syntax check; npm audit reports zero vulnerabilities. Desktop/mobile guest list and form screenshots reviewed. Tests use disposable PostgreSQL and mocked backend APIs, without production credentials.

Budget payments are planned only in phase 8. Example: agreed total 110 million, deposit 30 million plus another payment 20 million gives paid 50 million and remaining 60 million. Deposit is counted once. Legacy actualCost is not automatically treated as paid money.

## Remaining environment actions

- Visible Chrome preview initially opened successfully; its Vite child later stopped. Automatic approval review denied restarting that server, stating only “blocked by policy”. A user can run `node .viepilot/tools/local-preview.cjs` from the repository to start the isolated sample preview.
- A safer standard development server was subsequently started successfully at http://127.0.0.1:3000 with no mock configuration injected. It retains real Auth and shows setup requirements without Supabase environment variables. To manually open the sample preview alongside it, use `node .viepilot/tools/local-preview.cjs --port 3001`.
- The combined command to record evidence, commit and push was also rejected by automatic approval review with the same stated reason. Remote persistence is not claimed; files remain available in the workspace. No PR for this follow-up has been created.
- Real Supabase deployment is unchanged. Run the updated migration even if 2.2.1 was installed, then verify the real backend before deploying frontend 2.3.0.

Structured evidence: `verification.json`. The phase is code-verified but cannot be marked operationally complete while preview restart and remote persistence are unresolved.

## Individual files changed

```text
.viepilot/AI-GUIDE.md
.viepilot/ARCHITECTURE.md
.viepilot/HANDOFF.json
.viepilot/ROADMAP.md
.viepilot/TRACKER.md
.viepilot/phases/planning-phase-7/PHASE-STATE.md
.viepilot/phases/planning-phase-7/SPEC.md
.viepilot/phases/planning-phase-7/SUMMARY.md
.viepilot/phases/planning-phase-7/verification.json
.viepilot/phases/planning-phase-8/PHASE-STATE.md
.viepilot/phases/planning-phase-8/SPEC.md
.viepilot/tools/local-preview.cjs
CHANGELOG.md
README.md
SETUP.md
components/CommandCenter.tsx
components/GuestManager.tsx
components/guests/GuestForm.tsx
components/layout/BottomNav.tsx
components/layout/TopBar.tsx
data/milestones.ts
lib/backup.ts
lib/csv.ts
lib/guestStats.ts
lib/milestoneTasks.ts
package-lock.json
package.json
services/cloudService.ts
store/useStore.ts
supabase-fix-public-invitations.sql
supabase-migration.sql
tests/dashboard.test.tsx
tests/database.test.ts
tests/e2e/smoke.spec.ts
tests/guests.test.tsx
types.ts
```
