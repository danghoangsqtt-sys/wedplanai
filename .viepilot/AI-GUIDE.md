# WedPlan AI — working context

Use repository-relative task paths. Current release: budget ledger phase 8, 2.4.0 on `feat/planning-workflow-2026-11-03`, following audit phases 4–6 and personal/guest workflow phases 7/9.
Read the current task, phase state, `.viepilot/audit-report.md` and `.viepilot/audit/guardrails.json` before edits.
Preserve existing local/cloud user data. Use disposable databases and mocked network services for tests. Never store real credentials in the repository or public Vite build. No automatic production deployment.
Update task/phase/tracker/handoff evidence incrementally. A task is code-verified only after appropriate tests; report deployment/configuration gates separately. Do not claim historical deployment verification from old COMPLETE labels.

Budget phase 8 is implemented in the real app. `lib/budgetPayments.ts` is the shared source for money/date calculations in forms, dashboard, CSV and AI facts. Never use legacy `actualCost`/work status as paid cash. Deposits are included in paid; separate provisional balances and per-supplier overpayments from confirmed debt. Payment schedules use only wedding-relative offsets, while actual cash dates remain independent. Preserve allocations and void history in backup/JSONB. Read phase 8 SPEC, SUMMARY and verification evidence. The optional sample preview remains isolated from personal data.

Owner preference, reaffirmed 2026-11-03: default access is the previously configured personal PIN, for use with spouse and testing. Do not replace this with mandatory email/password during an audit or refactor unless the owner asks. `VITE_ACCESS_MODE=account` is explicit opt-in. Phase 9 restores this preference in 2.3.1; backend RLS remains independent, and local-only saves must not claim cross-device cloud sync.
