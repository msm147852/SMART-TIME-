#!/usr/bin/env python3
import json, re, zipfile
from pathlib import Path
from collections import Counter

import torch
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig
from trl import SFTConfig, SFTTrainer

REPO = Path('/kaggle/working/SMART-TIME')
DATASET = REPO / 'backend/ai/training/smart-time-tool-v2.jsonl'
OUT = Path('/kaggle/working/smart-ai-v2-final')
ZIP = Path('/kaggle/working/smart-ai-v2-super.zip')
BASE = 'Qwen/Qwen3-4B'
SYSTEM = 'انت SMART TIME. رجع JSON فقط حسب schema. ممنوع شرح وممنوع <think>.'
SEED = 42

EXPECTED = {'finance':300,'reminder':150,'calendar':150,'query':100,'unsupported':32,'clarification':14}
TOOLS = {'add_expense','add_daily_task','calendar.event.create','finance.summary','finance.compare','finance.income.summary','finance.fuel.summary','unsupported','clarification'}

def load_rows():
    if not DATASET.exists():
        raise FileNotFoundError(DATASET)
    rows = []
    with DATASET.open(encoding='utf-8') as f:
        for n, line in enumerate(f, 1):
            if line.strip():
                rows.append(json.loads(line))
    counts = Counter(r.get('category') for r in rows)
    print('TOTAL:', len(rows))
    print('CATEGORIES:', dict(counts))
    if len(rows) != 746 or dict(counts) != EXPECTED:
        raise ValueError('Dataset contract mismatch')
    seen = set()
    for i, r in enumerate(rows):
        if r.get('input') in seen: raise ValueError(f'duplicate input {i}')
        seen.add(r.get('input'))
        for k in ('instruction','input','output'):
            if k not in r: raise ValueError(f'missing {k} at {i}')
        obj = json.loads(r['output']) if isinstance(r['output'], str) else r['output']
        if not isinstance(obj, dict): raise ValueError(f'bad output {i}')
        if obj.get('tool') not in TOOLS: raise ValueError(f'bad tool {i}: {obj.get("tool")}')
        if not isinstance(obj.get('arguments'), dict): raise ValueError(f'bad arguments {i}')
        if '<think>' in r['output'].lower(): raise ValueError(f'think in target {i}')
    print('DATASET/SCHEMA GATE: PASS')
    return rows

def render(row, tokenizer):
    target = row['output'] if isinstance(row['output'], str) else json.dumps(row['output'], ensure_ascii=False, separators=(',',':'))
    messages = [
        {'role':'system','content':SYSTEM},
        {'role':'user','content':str(row['input'])},
        {'role':'assistant','content':target},
    ]
    try:
        return tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False, enable_thinking=False)
    except TypeError:
        return tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)

def main():
    if not torch.cuda.is_available(): raise RuntimeError('CUDA GPU required')
    print('GPU:', torch.cuda.get_device_name(0))
    print('BF16:', torch.cuda.is_bf16_supported())
    rows = load_rows()
    tokenizer = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)
    if tokenizer.pad_token is None: tokenizer.pad_token = tokenizer.eos_token
    ds = Dataset.from_list(rows).train_test_split(test_size=0.20, seed=SEED, shuffle=True)
    train = ds['train'].map(lambda x:{'text':render(x, tokenizer)}, remove_columns=ds['train'].column_names)
    ev = ds['test'].map(lambda x:{'text':render(x, tokenizer)}, remove_columns=ds['test'].column_names)
    print('TRAIN:', len(train), 'EVAL:', len(ev))

    bf16 = bool(torch.cuda.is_bf16_supported())
    dtype = torch.bfloat16 if bf16 else torch.float16
    bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4', bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype=dtype)
    model = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=bnb, device_map='auto', trust_remote_code=True)
    model.config.use_cache = False

    lora = LoraConfig(
        r=64, lora_alpha=128, lora_dropout=0.05, bias='none', task_type='CAUSAL_LM',
        target_modules=['q_proj','k_proj','v_proj','o_proj','gate_proj','up_proj','down_proj'])

    OUT.mkdir(parents=True, exist_ok=True)
    args = SFTConfig(
        output_dir=str(OUT),
        num_train_epochs=2,
        learning_rate=1e-4,
        lr_scheduler_type='cosine',
        warmup_ratio=0.10,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=16,
        gradient_checkpointing=True,
        logging_steps=10,
        eval_strategy='epoch',
        save_strategy='epoch',
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model='eval_loss',
        greater_is_better=False,
        fp16=not bf16,
        bf16=bf16,
        optim='paged_adamw_8bit',
        report_to='none',
        seed=SEED,
        max_length=512,
        dataset_text_field='text',
        completion_only_loss=True,
        packing=False,
    )
    trainer = SFTTrainer(model=model, args=args, train_dataset=train, eval_dataset=ev, processing_class=tokenizer, peft_config=lora)
    print('START TRAINING')
    trainer.train()
    metrics = trainer.evaluate()
    print('EVAL:', metrics)

    final = OUT / 'adapter'
    final.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(final))
    tokenizer.save_pretrained(str(final))
    (final/'metadata.json').write_text(json.dumps({
        'base_model':BASE, 'dataset_size':746, 'split':'80/20',
        'lora_r':64, 'lora_alpha':128, 'lora_dropout':0.05,
        'target_modules':['q_proj','k_proj','v_proj','o_proj','gate_proj','up_proj','down_proj'],
        'quantization':'4-bit NF4 double quant', 'compute_dtype':'bf16' if bf16 else 'fp16',
        'max_length':512, 'epochs':2, 'learning_rate':1e-4, 'warmup_ratio':0.10,
        'batch_size':1, 'gradient_accumulation':16, 'completion_only_loss':True,
        'system_prompt':SYSTEM, 'eval_metrics':metrics
    }, ensure_ascii=False, indent=2), encoding='utf-8')

    # 120+ generation contract cases
    model.eval(); passed = 0; failures = []
    for i, r in enumerate(ds['test'][:120]):
        messages=[{'role':'system','content':SYSTEM},{'role':'user','content':str(r['input'])}]
        try:
            try: prompt=tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
            except TypeError: prompt=tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            enc=tokenizer(prompt, return_tensors='pt', truncation=True, max_length=512)
            dev=next(model.parameters()).device; enc={k:v.to(dev) for k,v in enc.items()}
            with torch.no_grad(): out=model.generate(**enc, max_new_tokens=128, do_sample=False, eos_token_id=tokenizer.eos_token_id, pad_token_id=tokenizer.pad_token_id)
            gen=tokenizer.decode(out[0,enc['input_ids'].shape[1]:], skip_special_tokens=False).strip()
            if '<think>' in gen.lower() or '</think>' in gen.lower() or '```' in gen: raise ValueError('think/free-text markers')
            m=re.search(r'\\{.*\\}', gen, re.S); obj=json.loads(m.group(0) if m else gen)
            if not isinstance(obj,dict) or obj.get('tool') not in TOOLS or not isinstance(obj.get('arguments'),dict): raise ValueError('schema/tool failure')
            passed += 1
        except Exception as e: failures.append({'index':i,'error':str(e)[:250]})
    gate={'total':min(120,len(ds['test'])),'passed':passed,'rate':passed/min(120,len(ds['test'])),'failures':failures[:50]}
    (final/'generation_gate.json').write_text(json.dumps(gate,ensure_ascii=False,indent=2),encoding='utf-8')
    print('GENERATION GATE:', gate['passed'], '/', gate['total'], '=', f"{gate['rate']:.1%}")

    if ZIP.exists(): ZIP.unlink()
    with zipfile.ZipFile(ZIP,'w',zipfile.ZIP_DEFLATED) as z:
        for p in final.rglob('*'):
            if p.is_file(): z.write(p, Path('smart-ai-v2-final') / p.relative_to(final))
    print('DONE:', ZIP)

if __name__ == '__main__': main()