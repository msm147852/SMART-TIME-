#!/usr/bin/env python3
"""Generate predictions for the held-out SMART AI behavior set."""

from __future__ import annotations

import json
import os
from pathlib import Path

import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer


ROOT = Path(__file__).resolve().parents[3]
EVAL_FILE = ROOT / "backend/ai/training/smart-time-eval-v1.jsonl"
MODEL = os.getenv("MODEL", "").strip()
OUTPUT = Path(os.getenv("EVAL_OUTPUT", str(ROOT / "infra/smart-ai/training/eval-predictions.jsonl")))
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "220"))

SYSTEM_AR = (
    "أنت SMART AI داخل SMART TIME. استخدم بيانات SMART TIME فقط للأرقام والسجلات، "
    "لا تخترع معلومات، ولا تنفذ تعديلًا قبل تأكيد المستخدم."
)


def prompt(text: str) -> str:
    return f"<|system|>\n{SYSTEM_AR}\n<|user|>\n{text.strip()}\n<|assistant|>\n"


def main() -> None:
    if not MODEL:
        raise SystemExit("MODEL is required and should point to the trained model or LoRA output.")
    ds = load_dataset("json", data_files=str(EVAL_FILE), split="train")
    tokenizer = AutoTokenizer.from_pretrained(MODEL, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        MODEL,
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported()
        else torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto" if torch.cuda.is_available() else None,
    )
    model.eval()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as handle:
        for row in ds:
            inputs = tokenizer(prompt(row["input"]), return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.to(model.device) for k, v in inputs.items()}
            with torch.no_grad():
                generated = model.generate(
                    **inputs,
                    max_new_tokens=MAX_NEW_TOKENS,
                    do_sample=False,
                    pad_token_id=tokenizer.eos_token_id,
                )
            continuation = generated[0][inputs["input_ids"].shape[1]:]
            prediction = tokenizer.decode(continuation, skip_special_tokens=True).strip()
            handle.write(json.dumps({
                "category": row["category"],
                "input": row["input"],
                "expected_behavior": row["expected_behavior"],
                "prediction": prediction,
            }, ensure_ascii=False) + "\n")
    print(f"Wrote {len(ds)} predictions to {OUTPUT}")


if __name__ == "__main__":
    main()
