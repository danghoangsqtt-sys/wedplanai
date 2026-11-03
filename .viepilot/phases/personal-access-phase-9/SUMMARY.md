# Phase 9 ? personal PIN restored

Owner preference is restored: the default frontend uses the existing personal PIN rather than mandatory email/password. AccountGate retains the audited Auth flow only for explicit VITE_ACCESS_MODE=account. No database policies or credentials were weakened or embedded.

No Supabase configuration/session is needed for local use. Same-tab unlock and Lock app retain plan data. Local edits and editor Save use the existing persistent store, accurately report device storage and keep pending data for later authorized cloud sync. An existing cloud session must pass getUser and plan permission checks first. This does not implement cross-device synchronization using PIN alone.

Verification: 75 tests across 13 files; typecheck/lint/production build passed. Four Chrome flows passed (PIN/local persistence/lock, existing owner cloud session/editor, clean cloud reload of dashboard/guest details, public mobile invitation). Live localhost:3000 was separately checked without mock Auth: the correct PIN opened the dashboard and no email form was shown. PIN and dashboard screenshots reviewed. A new overlay badge initially blocked Save in the browser test; it was moved into the header and the flow passed normally without forced clicks.

Code remains on feat/planning-workflow-2026-11-03. This follow-up is saved locally; prior automatic-review rejection of remote push is not retried here, and no remote persistence or production deployment is claimed. The budget payment model remains planned only in phase 8.

## Individual files changed

```text
.env.example
.viepilot/AI-GUIDE.md
.viepilot/ARCHITECTURE.md
.viepilot/HANDOFF.json
.viepilot/ROADMAP.md
.viepilot/TRACKER.md
.viepilot/phases/personal-access-phase-9/PHASE-STATE.md
.viepilot/phases/personal-access-phase-9/SPEC.md
.viepilot/phases/personal-access-phase-9/SUMMARY.md
CHANGELOG.md
README.md
SETUP.md
components/AccountGate.tsx
components/PasswordGate.tsx
components/PersonalPinGate.tsx
components/invitation/editor/InvitationEditorPage.tsx
components/layout/SideNav.tsx
components/layout/TopBar.tsx
lib/backup.ts
lib/constants.ts
lib/personalAccess.ts
package-lock.json
package.json
store/useStore.ts
tests/e2e/smoke.spec.ts
tests/personalAccess.test.tsx
tests/security.test.tsx
vite-env.d.ts
```
