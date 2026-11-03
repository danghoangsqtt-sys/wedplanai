# Phase 9 — Restore personal PIN access

User correction 2026-11-03: temporarily use this app personally with spouse via the previously chosen six-digit PIN, rather than requiring an account login immediately. This preference overrides the earlier audit's choice of a mandatory account login UI; private backend RLS remains enforced.

## File-level plan

- `components/PasswordGate.tsx`: default personal PIN wrapper; retain explicit opt-in account access through `components/AccountGate.tsx` (existing verified Auth implementation).
- `components/PersonalPinGate.tsx`, `lib/personalAccess.ts`, `lib/constants.ts`, `vite-env.d.ts`: restore the historical PIN hash (verify it matches user input), six-digit entry, same-tab unlock/relock and optional account mode. Do not treat the browser flag as a database credential.
- `store/useStore.ts`: explicit local-only mode; persist edits and return local-save acknowledgement without network attempts. Preserve dirty data for future authorized cloud sync. Suspend timers on lock. Keep existing cloud conflict/read-failure behavior.
- `components/layout/SideNav.tsx`, `components/layout/TopBar.tsx`, `components/invitation/editor/InvitationEditorPage.tsx`: label Lock app and local saves accurately; local editor Save must work and must not claim a cloud save.
- PIN mode may silently use an already valid owner session for cloud access, after `getUser` and plan permission checks. Missing configuration/session never blocks local app access. No automatic email/password sign-in, embedded account credentials or weakened SQL policies.
- `tests/security.test.tsx`: preserve direct tests of explicit account mode. `tests/personalAccess.test.tsx`, `tests/persistence.test.ts`, `tests/e2e/smoke.spec.ts`: incorrect/correct PIN, lock, reload, no-network local access/save, optionally authorized cloud session and dirty-data durability.
- `.env.example`, README, SETUP, CHANGELOG, package version, backup app version and ViePilot state: document personal default, account opt-in and local vs cross-device cloud behavior. Keep old audit evidence as history.

## Acceptance

Default app asks only for the user's PIN, works without Supabase configuration, retains edits across reload, and can relock. Email/password UI appears only when explicitly configured. Server permissions are independent of PIN and unchanged. Local Save reports device persistence; cloud acknowledgement/error tests remain valid.

## Verification

Typecheck/lint/behavior tests/build; Chrome PIN flow on the running local app and existing mocked cloud/public regression. No production data mutation or deployment. Record local commit independently of previously rejected remote push.
