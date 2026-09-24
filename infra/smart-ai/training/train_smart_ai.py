#!/usr/bin/env python3
"""Fine-tune a local SMART AI model on synthetic SMART TIME behavior data.

Training is repository-data-only: customer records, chat history, secrets,
and Voice DNA recordings are never loaded by this script.
"""

from __future__ import annotations

import json
import math
import os
from pathlib import Path

import torch
from datasets import concatenate_datasets, load_dataset
from peft import LoraConfig, TaskType
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTConfig, SFTTrainer


ROOT = Path(__file__).resolve().parents[3]
TRAIN_FILES = [
    ROOT / "backend/ai/training/smart-time-v2.jsonl",
    ROOT / "backend/ai/training/smart-time-grounded-v1.jsonl",
]
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", str(ROOT / "infra/smart-ai/training/output")))
BASE_MODEL = os.getenv("BASE_MODEL", "Qwen/Qwen3-4B").strip()
USE_LORA = os.getenv("USE_LORA", "1").strip().lower() not in {"0", "false", "no"}
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "1024"))
EPOCHS = float(os.getenv("EPOCHS", "3"))
LR = float(os.getenv("LEARNING_RATE", "2e-4"))
BATCH = int(os.getenv("BATCH_SIZE", "2"))
GRAD_ACCUM = int(os.getenv("GRADIENT_ACCUMULATION_STEPS", "8"))
LORA_R = int(os.getenv("LORA_R", "16"))
LORA_ALPHA = int(os.getenv("LORA_ALPHA", "32"))
LORA_DROPOUT = float(os.getenv("LORA_DROPOUT", "0.05"))

SYSTEM_AR = (
    "أنت SMART AI داخل SMART TIME.\n"
    "استخدم بيانات SMART TIME فقط عند الحديث عن أرقام أو سجلات أو تواريخ.\n"
    "لا تخترع أي رقم أو سجل أو حقيقة غير موجودة في البيانات.\n"
    "لا تكشف أسرارًا أو مفاتيح API أو كلمات مرور أو PIN.\n"
    "لا تنفذ أي تعديل على البيانات من نفسك؛ أي تعديل يحتاج تأكيد المستخدم.\n"
    "تحدث بعربية مصرية طبيعية ومختصرة."
)

SYSTEM_EN = (
    "You are SMART AI inside SMART TIME.\n"
    "Use only supplied SMART TIME data for numbers, records, and dates.\n"
    "Never invent a number, record, or fact that is not present in the data.\n"
    "Never reveal secrets, API keys, passwords, or PINs.\n"
    "Never mutate data yourself; changes require explicit confirmation.\n"
    "Be concise and natural."
)


def build_prompt_messages(example: dict) -> dict:
    has_arabic = any("\u0600" <= char <= "\u06ff" for char in example["input"])
    system = SYSTEM_AR if has_arabic else SYSTEM_EN
    instruction = str(example.get("instruction", "")).strip()
    if instruction:
        system += "\nTraining behavior:\n" + instruction

    prompt = [
        {"role": "system", "content": system},
        {"role": "user", "content": example["input"].strip()},
    ]

    context = example.get("smartTimeData")
    if context is not None:
        prompt.append({
            "role": "user",
            "content": "Synthetic SMART TIME data:\n" + json.dumps(
                context, ensure_ascii=False
            ),
        })
        prompt.append({
            "role": "user",
            "content": "Answer the original request using that data.",
        })

    return {
        "prompt": prompt,
        "completion": [
            {"role": "assistant", "content": example["output"].strip()},
        ],
    }


def load_training_dataset():
    datasets = []
    for file in TRAIN_FILES:
        if not file.exists():
            raise SystemExit(f"Training dataset is missing: {file}")
        dataset = load_dataset("json", data_files=str(file), split="train")
        required = {"instruction", "input", "output", "category"}
        missing = required - set(dataset.column_names)
        if missing:
            raise ValueError(f"{file.name}: missing columns: {sorted(missing)}")
        dataset = dataset.map(build_prompt_messages)
        datasets.append(dataset.remove_columns([
            c for c in dataset.column_names if c not in {"prompt", "completion"}
        ]))
    return concatenate_datasets(datasets)


def choose_dtype() -> torch.dtype:
    if not torch.cuda.is_available():
        return torch.float32
    if torch.cuda.is_bf16_supported():
        return torch.bfloat16
    return torch.float16


def main() -> None:
    dataset = load_training_dataset()
    if len(dataset) < 80:
        raise SystemExit(
            f"Training dataset is too small for this experiment: {len(dataset)} examples."
        )

    split = dataset.train_test_split(
        test_size=min(0.15, max(2 / len(dataset), 0.05)),
        seed=42,
    )
    train_ds, eval_ds = split["train"], split["test"]

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=choose_dtype(),
    )

    peft_config = None
    if USE_LORA:
        peft_config = LoraConfig(
            r=LORA_R,
            lora_alpha=LORA_ALPHA,
            lora_dropout=LORA_DROPOUT,
            target_modules="all-linear",
            task_type=TaskType.CAUSAL_LM,
            bias="none",
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    args = SFTConfig(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=EPOCHS,
        learning_rate=LR,
        per_device_train_batch_size=BATCH,
        per_device_eval_batch_size=BATCH,
        gradient_accumulation_steps=GRAD_ACCUM,
        logging_steps=5,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        max_length=MAX_LENGTH,
        report_to="none",
        bf16=torch.cuda.is_available() and torch.cuda.is_bf16_supported(),
        fp16=torch.cuda.is_available() and not torch.cuda.is_bf16_supported(),
        completion_only_loss=True,
        packing=False,
    )

    trainer = SFTTrainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        processing_class=tokenizer,
        peft_config=peft_config,
    )

    trainer.train()
    metrics = trainer.evaluate()
    if "eval_loss" in metrics:
        try:
            metrics["perplexity"] = math.exp(float(metrics["eval_loss"]))
        except OverflowError:
            metrics["perplexity"] = float("inf")

    trainer.save_model(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    print({
        "model": BASE_MODEL,
        "train_examples": len(train_ds),
        "eval_examples": len(eval_ds),
        **{k: v for k, v in metrics.items() if isinstance(v, (int, float))},
    })


if __name__ == "__main__":
    main()
