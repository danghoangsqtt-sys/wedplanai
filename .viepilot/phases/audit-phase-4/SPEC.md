# Phase 4 — Audit remediation: secure foundation

Date: 2026-11-03. Mode: refactor/fix. Target release: 2.2.1.
Input: audit findings A01–A03, A11, A14–A16; requests BUG-001/002/005.

## Architecture decisions
- Replace browser-only PIN trust with Supabase Auth and database authorization. Public invitation routes remain public; private plan data and RSVP phone numbers require owner access.
- Preserve legacy owner plan UID and existing database rows. A private owner mapping binds an authenticated account to a legacy plan without rewriting its content or identifiers.
- Idempotent SQL creates tables before policies, replaces permissive policies, exposes only public wish fields, and contains no destructive DROP TABLE.
- System Gemini key lives only in an authenticated Edge Function. Explicit personal keys remain user-provided and use a tested selection policy.
- Test migrations and RLS in an ephemeral PostgreSQL-compatible PGlite database with mocked auth roles; never use production for destructive tests.

## Tasks
| Task | Outcome | Dependencies |
|---|---|---|
| 4.1 | Repeatable typecheck, lint, behavior and SQL tests; patched compatible dependencies | none |
| 4.2 | Auth gate and non-destructive secure SQL | 4.1 |
| 4.3 | Authenticated Gemini proxy and personal-key selection | 4.2 |

## Verification
`npm run typecheck`, `npm run lint`, targeted `npm test`, `npm run build`, `npm audit` with explicit classification of remaining advisories. Fresh/upgrade SQL retains seeded legacy rows; anon cannot read/mutate private data.

## Release boundary
Code is implemented and reviewed on `fix/audit-2026-11-03`. No production database migration, secret provisioning, or function deployment without the required deployment configuration. Report such deployment work separately from code verification.
