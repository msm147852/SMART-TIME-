# SMART TIME — Context & Memory Core V1

## Purpose

This layer gives SMART AI a persistent, structured context without treating the raw chat transcript as long-term memory.

## Runtime sources

1. SQLite conversation messages (`messages`) for recent conversation context.
2. SQLite `ai_memories` for explicit structured memories.
3. SQLite `ai_context_summaries` for compact conversation summaries.
4. Runtime date/time/timezone supplied by the request.
5. Active task/file identifiers supplied by the request.

## Memory contract

A memory contains: `id`, `userId`, `type`, `content`, `source`, `createdAt`, optional `expiresAt`, `sensitivity`, and `relevance`.

Memory is not inferred from arbitrary transcript text in this phase. Later memory extraction must be explicit, validated, and auditable.

## Model context

The local model receives recent conversation turns (bounded), relevant memories (bounded), SMART TIME canonical app data, and runtime date/time context. Secrets and sensitive vault data are excluded.

The model is not authoritative for execution, permissions, dates, or database state.

## Current implementation

- `backend/ai/smart-ai-tool/contextMemory.ts`
- `backend/ai/openMindBrain.ts`
- `backend/ai/localInference.ts`
- `backend/ai/types.ts`

## Current canonicalization status

- Tasks are canonical in SQLite `ai_tasks`, with verified backend CRUD and one-time import support.
- Expenses/budget have verified SQLite executors; HTTP exposure remains a separate integration step.
- Calendar events are modeled separately in SQLite `ai_events`; events must not be conflated with tasks.
- Reminder behavior is represented as explicit event/task fields and must be enforced by runtime scheduling rather than by model text.

## Next gates

1. Expose verified calendar event CRUD through authenticated backend routes.
2. Add canonical frontend event hydration and migration without reintroducing a competing localStorage source of truth.
3. Add reminder scheduling/runtime delivery with timezone-aware temporal validation.
4. Finish the expense/budget HTTP integration and then run a repository-wide source-of-truth audit.
