# Phase 7 — Dashboard persistence and guest management

Requested 2026-11-03. Base: ff6d1e1, dependent on the audit remediation branch. Branch: feat/planning-workflow-2026-11-03. Target: 2.3.0 after guest functionality ships. Budget payment work is planned separately in phase 8.

## Outcomes and file plan

1. Open a visible local browser preview now. No real Supabase configuration exists locally: `.viepilot/tools/local-preview.cjs` launches Vite on loopback and a visible Chrome with mocked Auth/API, isolated browser storage and sample data. `.viepilot/local-preview.local` holds only the preview process metadata; production Auth remains enforced.
2. Dashboard milestones: extract existing definitions into `data/milestones.ts`, add `MilestoneTask`/`MilestoneTaskStore` to `types.ts`, and validate/merge defaults/legacy data in `lib/milestoneTasks.ts`. `components/CommandCenter.tsx` uses the persisted shared store instead of a separate silent localStorage write. Add accessible checkbox labels and consistent progress.
3. `store/useStore.ts` adds milestone tasks, revision-protected sync, rehydration and safe legacy migration after successful reads. `services/cloudService.ts` maps the field. Both root SQL files add a nullable JSONB column and preserve it for older clients that omit it. `lib/backup.ts` includes and validates it, preserving old backups. Update every shared-load/reset/import boundary, without losing current data.
4. Guest management: after the optional preference reply, default to clear summary cards, group/attendance/invitation filters, stable add/edit dialog, phone/address/notes, party size and simple table assignment. `components/GuestManager.tsx` preserves RSVP import, retry and source-ID deduplication; `components/guests/GuestForm.tsx` provides an accessible stable form. `types.ts`, `lib/guestStats.ts`, `store/useStore.ts` and `lib/backup.ts` retain/validate optional fields. Older guests display unknown invitation status, never fabricated RSVP confirmations. `lib/csv.ts` safely exports full fields.
5. `tests/persistence.test.ts`, `tests/backup.test.ts`, `tests/database.test.ts`, `tests/guests.test.tsx`, `tests/dashboard.test.tsx`, `tests/e2e/smoke.spec.ts` verify immediate reload, cloud reload, legacy migration, guest editing/filtering, CSV and invalid input. Fixtures use sample data only.
6. Update README/SETUP/CHANGELOG/package version and `.viepilot/ROADMAP.md`, TRACKER/HANDOFF, this phase state and summary. Preserve prior audit history and explicit live deployment limits. Commit/push verified changes to the new branch.

## Acceptance

- Dashboard tick/add/delete/notes survive unmount/reload and acknowledged cloud round-trip; failed writes preserve pending edits.
- Existing separate dashboard tasks migrate without overwriting cloud tasks; empty task lists stay empty.
- Guest editing retains keyboard focus; group/RSVP/invitation/table views distinguish households from people and unrecorded states.
- Local preview opens visibly; no production credentials, data writes or Auth bypass are introduced into app code.
- Relevant tests, typecheck, lint, build and browser reload checks pass; deployment requirements documented.

## Verification

`npm run check`; `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`; `npm audit`; SQL fresh/upgrade and older-client preserving saves. Remote CI inspected when available.

## Integration refinements

- `components/layout/TopBar.tsx` and `components/CommandCenter.tsx`: show all attendees including children consistently; distinguish confirmed people from record counts.
- `components/layout/BottomNav.tsx`: mobile screenshot revealed the hidden More sheet still protrudes above the navigation bar; unmount it when closed and verify the guest form remains usable.
- `services/cloudService.ts`: explicitly select `milestone_tasks` so an outdated server schema rejects the initial read and locks writes, rather than falsely acknowledging an unsupported field.
