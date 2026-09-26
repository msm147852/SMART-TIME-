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
- streaming
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
