# Phase 8 — Budget ledger 2.4.0

Date: 2026-11-03. Status: **code verified locally** on `feat/planning-workflow-2026-11-03`.

The approved prototype is now implemented in the real app. Add a cost with estimate/optional agreed price and supplier, record a deposit, schedule T−N/T/T+N installments and record each actual payment. Budget and dashboard share the same calculation source, including post-wedding debt, overdue/next-seven-days, unplanned balances, history and CSV. PIN access remains unchanged.

## Delivered contracts and checkpoints

| Task | Result | Local checkpoint |
|---|---|---|
| 8.1 | Canonical ledger, validation, integer VND, per-supplier debt, relative dates, backup and atomic current-state mutations | `10b9e2f` |
| 8.2 | Real item/reconciliation/payment/schedule forms, retained history with void reason, filters and exports | `bfa4b93` |
| 8.3 | Dashboard, App/TopBar/AI facts, SQL/E2E regression, release docs and readable formatting of the new files | latest phase 8 release commit on this branch |

File-level implementation plans and their verification contracts are in `tasks/8.1.md`, `8.2.md`, `8.3.md`. Full changed-path inventory: `changed-files.txt`.

## Data semantics

- Deposit is included in paid. Work completion does not create a payment. Actual payment dates are separate from scheduled wedding offsets.
- Confirmed debt includes only reconciled, priced items. Unpriced/legacy amounts remain provisional; `actualCost` and old PAID statuses never silently become cash.
- Remaining debt is summed per supplier, with overpayments separate. Before/on + after + unscheduled equals confirmed debt. Future gift money is not netted against it.
- Existing records expose **Đối chiếu số liệu** with a confirmation and preview. Preserve the old amount; optionally use it as agreed price and explicitly enter total paid/deposit. An entry error can be voided with a retained reason/history; this is not an actual refund.
- Local storage, version 2 backups and verified revision-protected cloud saves retain all extensions. PostgreSQL save_plan JSONB needs no new SQL for this feature; older overall backend schemas still need SETUP.md migration.

## Verification

- `npm run check`: exit 0, **102 tests in 16 files**, typecheck, lint and production build passed.
- `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`: exit 0, **6 flows passed**. Includes PIN/local reload, actual deposit/schedules/partial-payment/dashboard, clean cloud financial round-trip, editor undo/save, milestones/guest cloud reload and public mobile RSVP.
- `npm audit --json`: zero vulnerabilities.
- Actual `http://127.0.0.1:3000`: HTTP 200, real PIN opens dashboard; legacy reconciliation contains total-paid/deposit fields, no JavaScript errors. Headless isolated browser context; no personal browser profile or stored user data touched.
- Desktop dashboard/list, mobile payment dialog and actual localhost reconciliation screenshots visually reviewed. Evidence snapshots in `screenshots/` contain isolated fixtures/default data.

## Limits and next external work

All code/checkpoints are local. Remote push and automatic visible-browser opening had been denied in earlier work and were not retried. There is no new deployment, Supabase credential/configuration change or live-backend verification. No full remote-persistence PASS is claimed. Separate devices still need existing verified cloud setup or backup transfer; using the same PIN alone does not sync them.

No bank execution, refund bookkeeping or automatic reminder delivery was added. These are separate capabilities from recording actual payments and correcting entry errors.
