# Phase 6 — Editor behavior and release documentation

Date: 2026-11-03. Input: A08–A10, S01/S02, D01/D02. Depends on Phase 5.

## Tasks
- 6.1: undo/redo survives autosave; shared section rendering honors order/visibility; editable rich text saves on blur and safely renders public HTML.
- 6.2: setup, environment example, release notes, historical state reconciliation, source-to-request evidence, and complete verification.

## Verification
React DOM behavior tests; build bundle secret scan with a dummy key; fresh/upgrade SQL/RLS tests; typecheck/lint/build/audit. Browser smoke test when a local browser runtime is available, with mocked backend rather than production.

## Historical tags
Do not invent historical phase-complete tags on the current HEAD. Record verifiable old phase commits where available; otherwise document historical checkpoint uncertainty. New task/phase tags refer only to verified new work.
