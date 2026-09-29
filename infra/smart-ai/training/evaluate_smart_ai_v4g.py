#!/usr/bin/env python3
"""Gate 4G behavioral evaluation for Qwen3-4B + SMART-TIME LoRA."""
from __future__ import annotations
import json, os
from pathlib import Path
import torch
from datasets import load_dataset
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

ROOT=Path(__file__).resolve().parents[3]
EVAL_FILE=ROOT/"backend/ai/training/smart-time-eval-v4g.jsonl"
MODEL=os.getenv("MODEL","").strip()
BASE_MODEL=os.getenv("BASE_MODEL","").strip()
OUTPUT=Path(os.getenv("EVAL_OUTPUT",str(ROOT/"infra/smart-ai/training/eval-v4g-predictions.jsonl")))
SYSTEM_PROMPT = """
You are SMART-TIME Intent Parser - Gate 4G Fix-1.

ALLOWED INTENTS (strict taxonomy - use ONLY these):
- conversation
- expense
- task
- reminder
- file_analysis
- web_research
- unknown

TOOL MAPPING (strict):
- expense -> finance.transaction.create
- task -> task.create
- reminder -> reminder.create
- file_analysis -> file.analyze
- web_research -> web.search
- conversation -> null
- unknown -> null

NORMALIZATION RULES (MANDATORY):
- name -> title
- due_date -> date
- category -> type
- file_id -> fileId
- expense_summary -> expense
- file -> fileId

CRITICAL RULES:
1. continuation + confirmation (yes, ok, continue) -> intent=unknown, tool=null, confirmation=true
2. credentials (password, api key, secret) -> intent=unknown, tool=null, confirmation=false
3. If intent is unknown or conversation, tool must be null
4. Never invent new intent names outside the 7 allowed.

Return JSON only: {intent, tool, args, confirmation}
"""
def dtype():
    if not torch.cuda.is_available(): return torch.float32
    return torch.bfloat16 if torch.is_bf16_supported() else torch.float16
def load_model():
    if not MODEL: raise SystemExit("MODEL is required.")
    tok=AutoTokenizer.from_pretrained(MODEL,use_fast=True)
    if tok.pad_token is None: tok.pad_token=tok.eos_token
    if (Path(MODEL)/"adapter_config.json").exists():
        if not BASE_MODEL: raise SystemExit("BASE_MODEL is required for a LoRA adapter.")
        base=AutoModelForCausalLM.from_pretrained(BASE_MODEL,torch_dtype=dtype(),device_map="auto" if torch.cuda.is_available() else None)
        model=PeftModel.from_pretrained(base,MODEL)
    else:
        model=AutoModelForCausalLM.from_pretrained(MODEL,torch_dtype=dtype(),device_map="auto" if torch.cuda.is_available() else None)
    model.eval(); return model,tok
def main():
    ds=load_dataset("json",data_files=str(EVAL_FILE),split="train"); model,tok=load_model()
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    with OUTPUT.open("w",encoding="utf-8") as out:
        for row in ds:
            msgs=[{"role":"system","content":SYSTEM_PROMPT},{"role":"user","content":row["input"].strip()}]
            if row.get("smartTimeData") is not None: msgs.append({"role":"user","content":"SMART TIME data:\n"+json.dumps(row["smartTimeData"],ensure_ascii=False)})
            rendered=tok.apply_chat_template(msgs,tokenize=False,add_generation_prompt=True,enable_thinking=False)
            inputs=tok(rendered,return_tensors="pt")
            if torch.cuda.is_available(): inputs={k:v.to(model.device) for k,v in inputs.items()}
            with torch.no_grad(): generated=model.generate(**inputs,max_new_tokens=180,do_sample=False,pad_token_id=tok.eos_token_id)
            continuation=generated[0][inputs["input_ids"].shape[1]:]
            raw=tok.decode(continuation,skip_special_tokens=True).strip()
            parsed=None; parse_error=None
            try:
                parsed=json.loads(raw)
                if not isinstance(parsed,dict): raise ValueError("prediction is not an object")
            except Exception as exc: parse_error=str(exc)
            out.write(json.dumps({"case_id":row["case_id"],"category":row["category"],"expected":row["expected"],"raw":raw,"prediction":parsed,"parse_error":parse_error},ensure_ascii=False)+"\n")
    print(f"Wrote {len(ds)} Gate 4G predictions to {OUTPUT}")
if __name__=="__main__": main()
