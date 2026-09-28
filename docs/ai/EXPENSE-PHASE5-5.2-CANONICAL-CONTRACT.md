# SMART TIME — PHASE 5.2
## Canonical Finance Contract — 8 Expense Types

**Status:** CONTRACT DEFINED  
**Branch:** `feat/v3-next`  
**Protected branch:** `main` — not touched  
**Phase:** 5 — Expense Modules Unification  
**Step:** 5.2 — Canonical Finance Contract  
**Contract file:** `src/types/finance.ts`

---

## 1. Purpose

Phase 5.2 defines the shared TypeScript vocabulary for Finance before any repository/API migration.

This commit is **contract-only**:

- no Expense API implementation
- no repository implementation
- no database migration
- no StorageAdapter change
- no Expense implementation deletion
- no UI behavior migration

The implementation work starts in Phase 5.3.

---

## 2. Canonical Contract

The canonical contract is:

- `ExpenseType`
- `Transaction`
- `Category`
- `Budget`
- `Income`
- `FinanceReports`

The eight supported Phase-5 expense types are exactly:

| Type | Meaning | Current legacy source |
|---|---|---|
| `house` | House expenses | `smart_time_house_expenses` |
| `medical` | Medical expenses | `smart_time_medical_expenses` |
| `personal` | Personal expenses | `smart_time_personal_expenses` |
| `student` | Student/education expenses | `smart_time_student_expenses` |
| `vehicle_fuel` | Vehicle fuel | `smart_time_vehicle_fuel` |
| `vehicle_maint` | Vehicle maintenance | `smart_time_vehicle_maint` |
| `vehicle_oil` | Vehicle oil/filter | `smart_time_vehicle_oil_filters` |
| `work` | Work expenses | `smart_time_work_expenses` |

The contract intentionally does not prescribe how any current UI module stores its data. That mapping belongs to the migration/repository phase.

---

## 3. Canonical Source-of-Truth Direction

The Phase 5 target is one Finance contract over canonical SQLite persistence.

The direction is:

`Legacy StorageAdapter data`
→ migration/normalization
→ **canonical Finance contract**
→ canonical SQLite Finance persistence
→ shared repository/API
→ UI + SMART AI

The contract is the domain boundary. It is not itself a database schema.

The specialized `finance_*` SQLite family is the intended canonical persistence family for Finance. Phase 5.3 will provide the repository/API layer that makes those tables conform to the contract.

---

## 4. Mapping the Existing `finance_*` SQLite Family

Phase 5.1 found these specialized tables:

- `finance_expenses`
- `finance_monthly_income`
- `finance_bank_certificates`
- `finance_fuel_records`
- `finance_maintenance_records`
- `finance_education_expenses`

Conceptual contract mapping:

| SQLite source | Contract domain | Phase-5 type mapping |
|---|---|---|
| `finance_expenses` | `Transaction` | `house`, `medical`, `personal`, `work` |
| `finance_education_expenses` | `Transaction` | `student` |
| `finance_fuel_records` | `Transaction` | `vehicle_fuel` |
| `finance_maintenance_records` | `Transaction` | `vehicle_maint` |
| `finance_maintenance_records` | `Transaction` | `vehicle_oil` when the maintenance record represents oil/filter service |
| `finance_monthly_income` | `Income` | income records derived by the repository layer |
| `finance_bank_certificates` | supporting Finance domain | not one of the eight expense types |

### Important implementation gap

The Phase 5.1 schema does **not** currently contain a first-class `ExpenseType` column on these specialized transaction tables.

Therefore this contract does **not** pretend the mapping is already implemented.

Phase 5.3 must define the authoritative normalization/mapping rules so that every returned `Transaction` has exactly one of the eight `ExpenseType` values.

No schema/API change is made in 5.2.

---

## 5. Mapping `ai_transactions` to the Same Contract

Phase 5.1 found that SMART AI currently writes:

`backend/ai/toolExecutor.ts → ai_transactions`

The current generic table contains fields such as:

- id
- user_id
- title
- amount
- category
- date
- payment_method
- notes
- created_at

It does not currently contain the complete Phase-5 contract shape.

Therefore `ai_transactions` is treated as a **legacy/generic AI finance representation that must normalize to the same `Transaction` contract**, not as a second canonical contract.

Conceptual mapping:

| `ai_transactions` | Canonical `Transaction` |
|---|---|
| `id` | `id` |
| `amount` | `amount` |
| `date` | `date` |
| `category` | category/type normalization input |
| `notes` | `note` |
| `created_at` | `createdAt` |
| runtime/source metadata | `source = "smart_ai"` |
| normalized AI category/type | `type` |
| canonical category mapping | `categoryId` |
| canonical update timestamp | `updatedAt` |

### Contract rule

After Phase 5 migration, AI and UI must consume the **same Transaction contract** and must not expose separate finance semantics.

The exact repository/API implementation and any required persistence migration are explicitly deferred to 5.3.

---

## 6. Mapping `ai_budgets` to the Same Contract

Phase 5.1 found:

`backend/ai/toolExecutor.ts → ai_budgets`

The current generic AI budget representation is:

- user_id
- monthly_limit
- currency
- updated_at

The canonical contract requires:

- `id`
- `type`
- `month`
- `limit`
- `spent`

Therefore `ai_budgets` is also a representation that must normalize to the canonical `Budget` contract.

The current table does **not** yet contain the complete contract fields. In particular, type/month/id/spent semantics need to be resolved by the implementation layer.

This is an explicit Phase 5.3 migration concern, not a Phase 5.2 schema change.

---

## 7. Legacy StorageAdapter Migration Boundary

Phase 4 established that `StorageAdapter` is the only implementation allowed to write directly to localStorage.

Phase 5.2 does **not** modify `storageAdapter.ts`.

The intended migration boundary is:

`StorageAdapter`
→ legacy reader/repository
→ normalize each legacy record
→ `Transaction | Budget | Income | Category`
→ canonical Finance repository/API
→ canonical SQLite

For the eight expense types, legacy keys map as follows:

- `smart_time_house_expenses` → `house`
- `smart_time_medical_expenses` → `medical`
- `smart_time_personal_expenses` → `personal`
- `smart_time_student_expenses` → `student`
- `smart_time_vehicle_fuel` → `vehicle_fuel`
- `smart_time_vehicle_maint` → `vehicle_maint`
- `smart_time_vehicle_oil_filters` → `vehicle_oil`
- `smart_time_work_expenses` → `work`

The migration must preserve IDs where safe, preserve dates/amounts/notes/category information, detect collisions/duplicates, and remain reversible/auditable until the later migration gate is passed.

No migration is executed in 5.2.

---

## 8. Category Contract

`Category` provides the shared identity used by `Transaction.categoryId`.

A category is explicitly associated with one `ExpenseType`:

`Category.type === Transaction.type`

The contract keeps presentation fields (`name`, `color`, `icon`) separate from transaction persistence.

Phase 5.3 will decide how existing legacy category values are normalized into stable category IDs.

---

## 9. Budget Contract

A `Budget` is scoped by:

- expense type
- month

and exposes:

- limit
- spent

The contract therefore prevents the old ambiguity between a generic monthly budget and type-specific Finance budgets.

The existing `smart_time_budget` and `ai_budgets` representations will be mapped into this contract during implementation.

---

## 10. Income Contract

`Income` remains separate from `Transaction`.

This preserves the Phase 5.1 distinction that monthly income, bank certificates, and car-trip income are Finance domains but are not among the eight expense types.

The `Income` contract is intentionally minimal at this stage:

- id
- amount
- date
- source

Detailed income/certificate normalization is an implementation concern for the later repository/API work.

---

## 11. Reports Contract

`FinanceReports` provides one shared reporting shape:

- `byType`
- `byMonth`
- `totals`

This establishes a common output contract for dashboards/reports without coupling the contract to a specific SQL query or UI component.

The report implementation is deferred to 5.3+.

---

## 12. Source-of-Truth Rules

Phase 5 establishes these architectural rules:

1. **One domain contract:** Finance consumers use the types in `src/types/finance.ts`.
2. **One canonical persistence direction:** specialized `finance_*` SQLite is the target Finance persistence family.
3. **AI and UI share the same contract:** `ai_transactions` / `ai_budgets` are normalized into the same contract rather than becoming a second Finance model.
4. **Legacy localStorage is migration input, not the final source of truth.**
5. **StorageAdapter remains unchanged:** it is a legacy persistence boundary during migration.
6. **No implementation deletion before migration verification.**
7. **No duplicate business semantics:** different storage representations must converge to the same contract.
8. **All eight expense types are first-class contract values.**

---

## 13. Phase Boundary

### Included in 5.2

- Canonical TypeScript Finance contract
- Eight expense types
- Mapping documentation
- Source-of-truth rules
- Legacy → contract direction
- `finance_*` → contract direction
- `ai_transactions` / `ai_budgets` → contract direction

### Explicitly excluded from 5.2

- Expense API implementation
- Repository implementation
- UI migration
- database schema migration
- data migration execution
- StorageAdapter modification
- deletion of existing Expense implementations

These begin only after the 5.2 contract is committed.

---

## 14. Phase 5.2 Gate

| Gate | Result |
|---|---|
| Canonical Finance contract exists | 🟢 |
| Exactly 8 Phase-5 expense types defined | 🟢 |
| Transaction contract defined | 🟢 |
| Category contract defined | 🟢 |
| Budget contract defined | 🟢 |
| Income contract defined | 🟢 |
| Reports contract defined | 🟢 |
| finance_* mapping documented | 🟢 |
| ai_transactions mapping documented | 🟢 |
| ai_budgets mapping documented | 🟢 |
| Legacy StorageAdapter migration boundary documented | 🟢 |
| Expense API implementation changed | 🔴 No — deferred to 5.3 |
| StorageAdapter changed | 🔴 No |
| Expense implementations deleted | 🔴 No |

**Phase 5.2 conclusion:** canonical Finance vocabulary is now fixed for the repository/API migration step.
