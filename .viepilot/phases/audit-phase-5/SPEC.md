# Phase 5 — Reliable data and invitations

Date: 2026-11-03. Input: A04–A07, A12, A13. Depends on Phase 4.

## Tasks
- 5.1: distinguish cloud read failure from empty data; preserve unsynced local edits and concurrency tokens; surface save failures; complete/version/validate backups; synchronize one wedding date.
- 5.2: await RSVP/wish acknowledgements, preserve retryable forms and stable IDs, map event selections, and preserve party size when importing guests.

## Invariants
No full-default writes after failed reads. Backup round-trip retains data. Older backups merge missing fields instead of resetting them. UI success means intended persistence succeeded. Public wishes never expose RSVP or phone data. Party size remains distinct from children count.

## Verification
Behavior tests with mocked network errors and races; schema/API contract checks; typecheck, lint, production build.
