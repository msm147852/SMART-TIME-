# SMART-TIME V3 Next — AI Evaluation Plan

## Existing evaluation foundation

Current repository:
- 60 SFT V2 records
- 22 held-out V1 evaluation records
- 66 grounded V3 records
- evaluation scripts v1/v2/v3

Existing evaluation topics include:
- numerical grounding
- no fabricated records
- confirmation before writes/deletes
- secret protection
- live-data routing
- Egyptian Arabic style

## Next evaluation suite

Create a versioned evaluation set with at least these categories:

1. Egyptian Arabic conversation
2. simple factual app questions
3. expense/task mutations
4. multi-step tool use
5. tool argument validation
6. confirmation/destructive actions
7. attachment understanding
8. PDF/DOCX/XLSX generation
9. structured chart/SVG generation
10. CAD specification generation
11. CAD validation/recovery
12. STT transcript robustness
13. TTS response pipeline
14. context/memory handling
15. refusal of unsupported claims
16. recovery from tool errors

## Required evidence gates

- model health
- /v1/models HTTP 200
- /v1/chat/completions HTTP 200
- streaming parser/unit test
- live GPU streaming endpoint
- structured tool-call validity
- verified DB mutation
- file creation + read-back
- CAD parse-back
- STT real microphone test
- TTS real playback test
- mobile interaction test
- security tests
- CI lint/typecheck/test/build

Never mark a gate PASS without test evidence.

## Training policy

Do not retrain merely because the current UI is weak.

First benchmark the existing Qwen3-4B + LoRA.
Collect failure cases from the agent evaluation.
Then perform targeted QLoRA only if the benchmark shows model-level failures that cannot be solved cleanly by orchestration/tools.

Compare:
- base model
- current adapter
- candidate adapter

Keep the current adapter until the candidate wins the agreed objective metrics.


## Gate 4G — behavioral validation

Gate 4G benchmarks the current Qwen3-4B + LoRA before any new training.

Versioned suite:
- `backend/ai/training/smart-time-eval-v4g.jsonl`
- `infra/smart-ai/training/evaluate_smart_ai_v4g.py`
- `scripts/score-smart-ai-eval-v4g.mjs`

The model must return a strict structured proposal:
`intent + tool + arguments + requiresConfirmation`.

Coverage:
1. Egyptian Arabic conversation
2. SMART-TIME intent recognition
3. structured expense/task/reminder actions
4. confirmation/destructive-action boundaries
5. file-analysis intent
6. web-research intent
7. clarification/context handling
8. secret protection
9. no-fabrication grounding
10. English routing

Gate 4G is PASS only when at least 80% of cases satisfy all required structural checks. A generated proposal is never execution evidence.

Run on the validated GPU environment:

```bash
python infra/smart-ai/training/evaluate_smart_ai_v4g.py
node scripts/score-smart-ai-eval-v4g.mjs
```

Do not retrain from Gate 4G failures alone. Classify failures first; orchestration/tool/runtime fixes take precedence over QLoRA.

## Next execution order

Gate 4G behavioral validation
→ AI Gateway
→ Context Engine
→ Memory
→ Planner
→ Tool Registry
→ Execution
→ Verification
→ Artifacts

CAD/DWG remains out of SMART-TIME scope.
