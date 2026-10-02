# SMART TIME — Groq-First AI Execution Plan

Status: ACTIVE CANONICAL PLAN
Branch: `feat/v3-next`
Replaces: the previous Plan 35 sequence and any phase numbering inherited from it.

## 0. Architecture decision

Production runtime is fixed to:

`Real STT -> Groq API -> RAG/Knowledge -> Structured Output -> Tools/Actions -> TTS -> E2E`

Non-negotiable rules:
1. Groq is the primary production AI provider for this plan.
2. All provider access is server-side behind a provider abstraction.
3. The existing Qwen3-4B + LoRA model, adapters, training outputs, datasets, provenance, evaluation assets and notebooks are preserved. They are not deleted and are not the production default for this plan.
4. Raw user/customer data is never added to training by this plan.
5. Existing verified Tool Registry, executors, canonical data layer, memory/context work, TTS assets and regression checks are reused where technically sound.
6. Browser Web Speech is not the production STT architecture. It may remain only as a clearly labeled fallback if it is retained.
7. A phase closes only after implementation, automated tests, runtime evidence where applicable, security/reproducibility evidence and CI pass.
8. Phase N+1 cannot start until Phase N is explicitly closed.
9. Main/production are not modified as part of this branch work.

## 1. Gap analysis: old architecture vs actual repository vs new target

| Capability | Actual state on `feat/v3-next` | Target | Disposition |
|---|---|---|---|
| Production LLM | `app/api/ai/infer/route.ts` is still Local-Qwen-first; `SMART_AI_LOCAL_URL` controls it | Groq-first provider gateway | REIMPLEMENT PRODUCTION ROUTING |
| Groq | `backend/ai/providers/groqProvider.ts` exists; Railway staging has `GROQ_API_KEY`; deployment `7b2918bc...` is SUCCESS | Full provider contract + inference path | KEEP + EXTEND |
| Structured output | V2 validator and mutation confirmation boundaries already exist | Provider-independent structured/tool contract | REUSE + HARDEN |
| Tools/actions | Typed V3 registry/executor and verified finance/task mutations exist; calendar create still reports not implemented in the current infer route | Groq tool calling -> validator -> permission -> confirmation -> executor -> verification | REUSE + INTEGRATE |
| STT | Browser Web Speech API is implemented and Phase 12 static gates pass, but real runtime evidence remains open | Server-side Groq Whisper STT | REIMPLEMENT PRODUCTION STT |
| User audio evidence | Five real recordings validated locally; raw audio remains outside Git; Phase 12 runtime evidence is still incomplete | External runtime/evaluation evidence only | KEEP |
| RAG/knowledge | Context/memory infrastructure exists, but no verified end-to-end production retrieval loop is established | Retrieval before reasoning with provenance and limits | NEW/REWORK |
| Memory/context | Conversation/memory/context modules exist and are used by parts of the V3 AI stack | Provider-independent context layer connected to retrieval | REUSE + HARDEN |
| TTS | Browser/system TTS and Voice DNA/provider boundary exist; full production voice E2E is not verified | Verified Egyptian-Arabic TTS after grounded response | REUSE + INTEGRATE |
| E2E voice | Canonical order is documented; full real STT -> AI -> TTS evidence is not closed | Real end-to-end voice proof | NEW/REWORK |
| Security | Server-side secret pattern and mutation confirmation exist; Groq key has been staged on Railway without exposing it | Secret isolation, auth, rate/payload limits, privacy and cost controls | HARDEN |
| CI | Existing phase-specific workflows are green on commit `28e74ac`; Groq-specific full contract is not yet complete | Coherent Groq architecture/regression gate | EXTEND |
| Training/model assets | Qwen/LoRA/training/dataset artifacts exist | Preserve as research/evaluation/future provider asset | KEEP/ARCHIVE, DO NOT DELETE |

## 2. Phase sequence

### Phase A0 — Architecture Freeze & Asset Preservation
Objective: make the new architecture the single source of truth without deleting existing model/data assets.

Deliverables:
- this plan
- updated AI architecture contracts
- asset disposition record
- explicit separation of production Groq path from preserved Qwen/LoRA path
- CI baseline

Closure gate:
- docs agree with the target pipeline
- no protected model/dataset/training asset was deleted
- Groq staging secret remains server-side
- CI is green on the phase-closing commit

### Phase A1 — Provider Gateway & Groq Runtime
Objective: replace provider-specific assumptions with one server-side AIProvider boundary.

Required:
- chat/streaming/structured-output/health/model metadata contract
- Groq adapter
- model selection by server configuration
- timeout/retry/error taxonomy
- secret isolation and bundle scan
- runtime health verification

Closure gate:
- automated provider contract tests
- auth/timeout/rate/error handling tests
- real Railway staging Groq connectivity evidence
- CI green

### Phase A2 — Real Groq STT
Objective: make Groq Whisper the production STT path.

Required:
- authenticated server transcription endpoint
- client microphone capture only
- ar-EG default
- Egyptian Arabic, code-switch, numbers/dates
- no fabricated transcript
- size/duration/content-type limits
- no raw audio persistence by default
- provider failure and permission-denial behavior

Closure gate:
- real microphone/browser evidence
- all required runtime cases from the preserved Phase 12 evidence set
- privacy/security evidence
- CI green

### Phase A3 — RAG / Knowledge / Context
Objective: make retrieval a first-class deterministic input to reasoning.

Required:
- source/provenance registry
- chunking/indexing
- vector-store interface (existing Chroma work may be reused)
- metadata filters and retrieval budget
- no-source/no-match behavior
- source identifiers/citations where applicable
- application context and memory integrated without database dumping

Closure gate:
- deterministic retrieval tests
- empty/stale/conflicting source tests
- per-user isolation/privacy tests
- CI green

### Phase A4 — Groq Structured Reasoning Contract
Objective: connect Groq responses to application-owned structured output.

Required:
- structured response schema
- tool-call normalization
- invalid/malformed response handling
- bounded recovery
- explicit clarification/unsupported states
- no free-text action execution
- preserve confirmation boundaries

Closure gate:
- representative Arabic/English reasoning tests
- schema-invalid tests
- confirmation tests
- provider failure tests
- CI green

### Phase A5 — Tools & Actions
Objective: connect structured Groq tool calls to verified SMART TIME actions.

Pipeline:
`understand -> structured call -> validate -> permission -> confirm -> execute -> read-back -> respond`

Required:
- reuse existing registry/executors
- strict argument schemas
- read/mutation separation
- idempotency where needed
- finance/task/calendar representative coverage
- no success claim without authoritative verification

Closure gate:
- positive and negative action tests
- confirmation denial
- unauthorized access
- execution failure
- persistence/read-back verification
- CI green

### Phase A6 — Memory & Conversation Continuity
Objective: make multi-turn behavior provider-independent and retrieval-aware.

Required:
- recent conversation
- persistent memory
- application state
- verified tool results
- retrieval budget
- memory write/update policy
- user isolation
- no sensitive prompt leakage

Closure gate:
- multi-turn tests
- stale/conflicting memory tests
- per-user isolation
- CI green

### Phase A7 — TTS + Voice E2E
Objective: close the complete production voice loop.

Target:
`Microphone -> Groq STT -> RAG/Knowledge -> Groq reasoning -> structured tool/action -> verified result -> Egyptian TTS -> playback`

Required:
- existing Egyptian TTS/Voice DNA boundaries reused
- turn-taking/interruption protection
- no duplicate mic reopen
- STT/Groq/tool/TTS failure handling
- grounded read-back

Closure gate:
- real browser/mobile conversation
- interruption and failure cases
- tool confirmation in voice
- end-to-end artifact/evidence package
- CI green

### Phase A8 — Security, Cost, Regression & Release Candidate
Objective: prove the new path is safe, reproducible and does not regress completed product work.

Required:
- secret scan and server-only key proof
- auth/rate/payload abuse controls
- privacy/data-minimization audit
- provider usage/error telemetry without sensitive content
- bounded retries/timeouts
- full regression CI
- performance baseline
- preserved asset audit
- production activation checklist

Closure gate:
- all A0-A7 closed
- no unresolved security/privacy/reproducibility blocker
- final full CI green
- real voice E2E evidence
- owner sign-off

## 3. Status at plan creation

- A0: READY TO CLOSE after architecture/doc alignment and CI.
- A1: PARTIAL PREPARATION — Groq provider adapter exists, Railway staging secret exists, deployment `7b2918bc-f60f-42b5-8888-8c558b8279bb` is SUCCESS; full provider gateway/runtime proof is not yet closed.
- A2: NOT STARTED — existing browser Web Speech implementation is evidence/work to be superseded as production STT.
- A3: NOT CLOSED — retrieval architecture needs a verified production loop.
- A4: PARTIAL — V2 structured validation exists but is coupled to the local inference route.
- A5: PARTIAL — typed tools and verified mutations exist; Groq integration is missing.
- A6: PARTIAL — context/memory exists but must be provider-independent and connected to RAG.
- A7: NOT CLOSED — TTS/voice components exist but complete real E2E is not proven.
- A8: NOT STARTED.

## 4. Asset policy

KEEP:
- all Qwen3-4B + LoRA model/adapters/evaluation artifacts
- all training datasets and provenance
- training scripts/notebooks/runbooks
- user audio evidence metadata
- verified Tool Registry/executors
- canonical data layer
- TTS/VoiceTuT/Voice DNA assets and contracts
- existing CI/regression workflows unless explicitly superseded by a documented replacement

MODIFY/REIMPLEMENT:
- Local-Qwen-first production routing
- `backend/ai/inference/localInference.ts` as the production path
- browser Web Speech as primary STT
- architecture docs that name LocalQwen as the current production provider
- any route that couples provider selection to business logic

DO NOT DELETE:
- the trained model
- datasets
- model artifacts
- evaluation assets
- local provider implementation

## 5. Global definition of done

The new plan is closed only when A0 through A8 are PASS, all relevant CI is green on the final commit, Groq is the production provider, real STT -> RAG -> structured output -> tools -> TTS -> E2E evidence exists, security/privacy/reproducibility gates pass, and preserved model/dataset assets remain intact.
