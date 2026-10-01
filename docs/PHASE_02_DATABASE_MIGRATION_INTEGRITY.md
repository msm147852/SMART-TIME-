# SMART-TIME Phase 2 — Database + Migration Integrity

Status: IN PROGRESS
Branch: `phase/02-database-migration-integrity`
Baseline: `feat/v3-next@d27504fd43fcbb5d97ca1f466f7e72da030c75de`
Date: 2026-10-01

## Goal

Close the database layer as a verified foundation before backend/API work continues.

## Scope

1. Preserve the canonical AI/finance schema as the DDL source of truth.
2. Verify application bootstrap tables required by the current backend.
3. Prove database startup is idempotent against the same database file.
4. Prove SQLite integrity checks pass before and after data operations.
5. Prove canonical indexes exist.
6. Prove representative application-domain read/write operations work and can be rolled back safely.
7. Keep database testability isolated from production data by allowing a test-only database path through `SMART_TIME_DB_PATH`.

## Existing architecture being verified

- `backend/database/canonicalSchema.ts` owns the canonical AI/finance DDL.
- `backend/database.ts` initializes the SQLite database, applies the canonical schema, and contains the current safe/idempotent bootstrap migrations.
- `scripts/verify-canonical-schema.mjs` prevents duplicate canonical AI/finance CREATE TABLE DDL in backend code.

## Phase 2 acceptance gates

| Gate | Requirement | Evidence | Pass condition |
|---|---|---|---|
| P2-01 | Canonical schema ownership | `npm run verify:canonical-schema` | 11 canonical tables are centrally defined with no duplicate canonical DDL in backend code. |
| P2-02 | Bootstrap schema completeness | `npm run test:phase2-db` | All current required application + canonical tables exist. |
| P2-03 | Migration idempotence | `npm run test:phase2-db` | Two consecutive boots against the same DB file leave schema usable with no table-count drift. |
| P2-04 | SQLite integrity | `npm run test:phase2-db` | `PRAGMA integrity_check` returns `ok` on both boot and post-canary checks. |
| P2-05 | Canonical indexes | `npm run test:phase2-db` | All canonical AI/finance indexes exist. |
| P2-06 | Read/write integrity | `npm run test:phase2-db` | Representative transaction/task/event/expense/income/budget writes are readable and rollback cleanly. |
| P2-07 | Regression baseline | lint + existing AI tests + build | Existing application typecheck, Open Mind tests, and production build remain green. |
| P2-08 | Reproducibility | GitHub Actions | The complete Phase 2 gate passes on a clean Ubuntu runner. |
| P2-09 | Phase governance | sign-off record | Phase 2 is explicitly marked PASS before Phase 3 work starts. |

## Notes

Phase 2 does not introduce the AI tool registry, orchestrator, model training, voice stack, or attachments. Those belong to later phases.

Phase 2 does not retroactively close historical storage-key phases. The old `phase2-verify.yml` storage-key workflow is legacy evidence and is not the closure criterion for this audited Phase 2.

## Sign-off record

Owner: pending
Decision: pending
Date: pending
Notes: pending
