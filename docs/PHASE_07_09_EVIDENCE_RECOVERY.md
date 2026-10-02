# Phase 7–9 Evidence Recovery Update

Date: 2026-10-02

## Newly recovered authoritative evidence

### Training artifact

The historical model/data registry records a Kaggle diagnostic artifact:

- artifact ID: `adapter-v2-kaggle-20261001`
- base model: Qwen/Qwen3-4B
- method: SFT + LoRA
- dataset: `dataset-tool-v2-746`
- split: 596 train / 150 eval
- hardware: NVIDIA Tesla T4, FP16
- epochs: 2
- train loss: 0.2327
- eval loss: 0.12700095772743225
- artifact path: `/kaggle/working/smart-ai-v2-super.zip`

### Gate result

The same registry explicitly records:

`generation_gate.total = 120`
`generation_gate.passed = 0`
`generation_gate.rate = 0`

and:

`release_status = blocked_generation_gate`

Therefore this artifact is **not a release candidate and does not establish a Phase 7 PASS**.

### Dataset provenance

The 746-row structured dataset is independently recorded with:

- 746 unique inputs
- 596 training examples
- 150 evaluation examples
- blob SHA `f9d513485922ac4d9ade589e4be2fe2d53a50bb9`
- source commit `6620da09f9e4ad808be1bcf1dc9f4d83fedff4f3`

### Recovery snapshot

A pre-training recovery manifest dated 2026-09-30 records exact SHA-256 values for the then-current training datasets and training script, tied to commit `76a7a02994b0a97f3f4baa053ea3a7a8ee5b648c`.

## Consequence for Phase 7

Phase 7 cannot be closed merely by pointing to the adapter. The recovered evidence proves a real training run and a real failed generation gate.

**Phase 7 status remains: HISTORICALLY EXECUTED / GATE NOT PASSED / FORMAL CLOSURE BLOCKED.**

## Consequence for Phase 8

Because the diagnostic artifact is explicitly marked blocked by the generation gate, it cannot be promoted as the archived releasable V1 artifact.

The artifact and its metadata should remain preserved as diagnostic evidence.

**Phase 8 status remains: HISTORIC ARTIFACT PRESERVED / RELEASE ROLLBACK CLOSURE NOT ESTABLISHED.**

## Consequence for Phase 9

The recovered registry explains the failed 120-case generation gate at a high level (0/120), but it does not contain the later corrected 113/120 evaluator output or the seven-case diagnosis.

The previously known 113/120 claim therefore remains a separate historical claim that is not independently recovered from the current Git evidence.

**Phase 9 status remains: DIAGNOSIS CLAIM KNOWN / AUTHORITATIVE GATE ARTIFACT NOT RECOVERED.**

## Next recovery target

Recover the actual 120-case raw generation output and evaluator implementation/version used for the diagnostic run. Then determine whether the 113/120 correction can be reproduced from those raw outputs. Do not retrain before this recovery attempt is exhausted.
