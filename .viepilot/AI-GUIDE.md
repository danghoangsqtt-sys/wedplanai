# WedPlan AI — working context

Use repository-relative task paths. Current work: audit remediation phases 4–6, targeting 2.2.1 on `fix/audit-2026-11-03`.
Read the current task, phase state, `.viepilot/audit-report.md` and `.viepilot/audit/guardrails.json` before edits.
Preserve existing local/cloud user data. Use disposable databases and mocked network services for tests. Never store real credentials in the repository or public Vite build. No automatic production deployment.
Update task/phase/tracker/handoff evidence incrementally. A task is code-verified only after appropriate tests; report deployment/configuration gates separately. Do not claim historical deployment verification from old COMPLETE labels.

Current follow-up: phase 7 planning workflow on feat/planning-workflow-2026-11-03, target 2.3.0. Phase 8 budget payment model is planned only. Read the phase 7 SPEC and phase state. The visible local sample preview is isolated from production.

Owner preference, reaffirmed 2026-11-03: default access is the previously configured personal PIN, for use with spouse and testing. Do not replace this with mandatory email/password during an audit or refactor unless the owner asks. `VITE_ACCESS_MODE=account` is explicit opt-in. Phase 9 restores this preference in 2.3.1; backend RLS remains independent, and local-only saves must not claim cross-device cloud sync.
