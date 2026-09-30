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
from peft import LoraConfig, TaskType, prepare_model_for_kbit_training
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTConfig, SFTTrainer


ROOT = Path(__file__).resolve().parents[3]
TRAIN_FILES = [
    ROOT / "backend/ai/training/smart-time-sft.jsonl",
    ROOT / "backend/ai/training/smart-time-grounded-v4-batch-a.jsonl",
    ROOT / "backend/ai/training/smart-time-grounded-v4-batch-b-train.jsonl",
]
ONTOLOGY_FILE = ROOT / "backend/ai/training/tool-ontology.json"
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", str(ROOT / "infra/smart-ai/training/output")))
BASE_MODEL = os.getenv("BASE_MODEL", "Qwen/Qwen3-4B").strip()
USE_LORA = os.getenv("USE_LORA", "1").strip().lower() not in {"0", "false", "no"}
USE_QLORA = os.getenv("USE_QLORA", "1").strip().lower() not in {"0", "false", "no"}
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "1024"))
EPOCHS = float(os.getenv("EPOCHS", "3"))
LR = float(os.getenv("LEARNING_RATE", "2e-4"))
BATCH = int(os.getenv("BATCH_SIZE", "2"))
GRAD_ACCUM = int(os.getenv("GRADIENT_ACCUMULATION_STEPS", "8"))
LORA_R = int(os.getenv("LORA_R", "16"))
LORA_ALPHA = int(os.getenv("LORA_ALPHA", "32"))
LORA_DROPOUT = float(os.getenv("LORA_DROPOUT", "0.05"))

SYSTEM_AR = (
    "أنت SMART AI داخل SMART TIME، واسم شخصيتك لهلوبة.\n"
    "لهلوبة ست بيت مصرية شاطرة، سكرتيرة محترفة، وصاحبة مصرية جدعة؛ "
    "ذكية وحنينة وعملية، تفهم الكلام المصري الطبيعي وترد باختصار ووضوح.\n"
    "الشخصية لا تغيّر عقد JSON ولا أسماء الأدوات ولا قواعد الأمان.\n"
    "استخدم بيانات SMART TIME فقط عند الحديث عن أرقام أو سجلات أو تواريخ.\n"
    "لا تخترع أي رقم أو سجل أو حقيقة غير موجودة في البيانات.\n"
    "لا تكشف أسرارًا أو مفاتيح API أو كلمات مرور أو PIN.\n"
    "لا تنفذ أي تعديل على البيانات من نفسك؛ أي تعديل يحتاج تأكيد المستخدم.\n"
    "عند طلب إخراج منظم، أخرج JSON فقط بالمفاتيح الكانونية: "
    "{\"intent\": \"...\", \"tool\": \"...\", "
    "\"arguments\": {}, \"requiresConfirmation\": false}.\n"
    "استخدم arguments وليس args، وrequiresConfirmation وليس confirmation.\n"
    "طبّق التطبيع: category->type، name->title، due_date->date، file_id->fileId.\n"
    "استخدم analyze_file وليس file.analyze، وweb_search وليس web.search."
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
    has_arabic = any("؀" <= char <= "ۿ" for char in example["input"])
    system = SYSTEM_AR if has_arabic else SYSTEM_EN
    instruction = str(example.get("instruction", "")).strip()
    if instruction:
        system += "\nTraining behavior:\n" + instruction
    if ONTOLOGY_FILE.exists():
        ontology = json.loads(ONTOLOGY_FILE.read_text(encoding="utf-8"))
        system += (
            "\nCanonical tool contract (JSON only):\n"
            + json.dumps(ontology, ensure_ascii=False)
            + "\nUse ONLY canonical intent/tool names from this contract. "
              "Never emit forbidden or legacy tool names."
        )

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
        "messages": [
            *prompt,
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
            c for c in dataset.column_names if c != "messages"
        ]))
    return concatenate_datasets(datasets)


def choose_dtype() -> torch.dtype:
    if not torch.cuda.is_available():
        return torch.float32
    major, _minor = torch.cuda.get_device_capability()
    if major >= 8:
        return torch.bfloat16
    return torch.float16


def main() -> None:
    dataset = load_training_dataset()
    expected_total = 346
    if len(dataset) != expected_total:
        raise SystemExit(
            f"Gate 4G training contract requires exactly {expected_total} examples; found {len(dataset)}."
        )

    split = dataset.train_test_split(
        test_size=min(0.15, max(2 / len(dataset), 0.05)),
        seed=42,
    )
    train_ds, eval_ds = split["train"], split["test"]

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    if USE_QLORA:
        from transformers import BitsAndBytesConfig
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=choose_dtype(),
            bnb_4bit_use_double_quant=True,
        )
        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            quantization_config=quant_config,
            torch_dtype=choose_dtype(),
        )
        model = prepare_model_for_kbit_training(model)
    else:
        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            torch_dtype=choose_dtype(),
        )

    gradient_checkpointing = os.getenv(
        "GRADIENT_CHECKPOINTING", "1"
    ).strip().lower() not in {"0", "false", "no"}
    if gradient_checkpointing:
        model.config.use_cache = False
        model.gradient_checkpointing_enable()
        if hasattr(model, "enable_input_require_grads"):
            model.enable_input_require_grads()

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
        assistant_only_loss=True,
        loss_type="nll",
        report_to="none",
        # Keep Trainer AMP disabled for QLoRA on pre-Ampere GPUs.
        # The 4-bit compute dtype is still selected by choose_dtype().
        bf16=False,
        fp16=False,
        packing=False,
        gradient_checkpointing=gradient_checkpointing,
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
        "training_contract_examples": len(dataset),
        "use_qlora": USE_QLORA,
        "model": BASE_MODEL,
        "train_examples": len(train_ds),
        "eval_examples": len(eval_ds),
        **{k: v for k, v in metrics.items() if isinstance(v, (int, float))},
    })


if __name__ == "__main__":
    main()
