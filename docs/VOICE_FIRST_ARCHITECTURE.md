# SMART-TIME V3 Next — Voice-First Architecture Contract

Status: PHASE 10 CANONICAL DESIGN
Phase: 10 — Voice-First Architecture + Execution Order
Branch: feat/v3-next

## Purpose

This document is the single execution-order contract for the SMART TIME voice-first path.

A phase after Phase 10 must not redefine the order below. Later phases may implement or strengthen individual layers, but they must preserve the trust boundaries.

## Canonical runtime order

```
User Voice
  ↓
Voice Capture / Microphone
  ↓
STT / ASR
  ↓
Transcript + STT metadata
  ↓
SMART AI Orchestrator
  ↓
Intent / Action Proposal
  ↓
Policy + Schema Validator
  ↓
Central Tool Registry / Agent Router
  ↓
Tool / Service Execution
  ↓
Read-back Verification
  ↓
SMART AI Response
  ↓
TTS / Voice Output
  ↓
User
```

## Layer responsibilities

### 1. Voice Input
Owns microphone capture and audio-session lifecycle.

It must not execute application mutations and must not receive database secrets.

### 2. STT / ASR
Converts audio to transcript plus measurable metadata.

Required future evidence:
- real microphone input
- Arabic/Egyptian transcript
- noisy/fast speech coverage
- transcript accuracy evidence

### 3. SMART AI / Orchestrator
Consumes transcript text and permitted application context.

Current repository implementation:
- deterministic Open Mind planning
- optional local Qwen-compatible inference
- conversation/memory context

The model is not a database client and does not receive secrets.

### 4. Policy + Schema Validator
The only boundary allowed to authorize a proposed executable action.

Required invariants:
- intent/tool must belong to the registered action taxonomy
- arguments must satisfy the tool schema
- confirmation requirements must be explicit
- destructive actions require a final scope/confirmation boundary
- unsupported claims must remain unsupported
- invalid proposals never reach execution

### 5. Central Tool Registry / Agent Router
Maps only validated proposals to approved tools.

Tools execute server-side under authenticated user identity.

### 6. Tool / Service
Performs the actual side effect or read operation.

The tool layer owns database/service access. The model never receives direct database credentials.

### 7. Verification
Every mutation must be read back from the authoritative store before it is reported as successful.

### 8. SMART AI Response
Produces the user-facing result from verified evidence.

No tool result means no fabricated success.

### 9. TTS / Voice Output
Converts the verified response text to audio.

Personalized Voice DNA remains a separate provider boundary and must not change the AI/data trust model.

## Canonical evaluation order

Evaluation follows runtime order and must not skip a trust boundary:

1. Model health / serving contract
2. STT transcript correctness
3. Intent preservation from transcript to proposal
4. Structured proposal validity
5. Policy/schema validation
6. Confirmation boundary
7. Tool execution
8. Read-back verification
9. Response grounding
10. TTS synthesis
11. Audio playback
12. End-to-end voice latency/error evidence
13. Security and privacy checks
14. Reproducibility / artifact evidence

A generated model proposal is never execution evidence.

## Training gate

No new training run is authorized by Phase 10 itself.

Before any later training run, the run must have a versioned manifest containing at minimum:
- base model and revision
- training datasets and checksums
- held-out evaluation dataset and checksum
- adapter configuration
- training hyperparameters
- runtime/library versions
- seed
- evaluation suite/version
- expected gates
- artifact output location
- rollback reference

Targeted retraining remains downstream of measured model-level failures.

## Trust boundaries

```
Voice/STT        -> text only
SMART AI         -> proposal only
Validator        -> validated proposal only
Tool Router      -> approved tool only
Tool             -> real services/data
Verification     -> authoritative read-back
TTS              -> verified response text
```

## Current implementation truth

Implemented now:
- deterministic SMART AI planning
- selected verified DB mutations
- optional local OpenAI-compatible inference
- Voice DNA provider boundary
- browser TTS fallback

Not implemented/verified yet:
- real STT pipeline
- general central policy/schema validator
- general structured tool-call loop
- real Voice -> STT -> AI -> TTS E2E
- production TTS runtime evidence

Those gaps belong to later phases and must not be hidden by this architecture document.

## Phase 10 closure criterion

Phase 10 can be considered architecturally closed only when:
1. this contract is committed on the canonical working branch;
2. the evaluation order is referenced by the evaluation plan;
3. the pre-run training manifest is present and validated;
4. a verification script proves the three artifacts agree;
5. no training run is triggered as part of Phase 10.
