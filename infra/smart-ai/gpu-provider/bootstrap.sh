#!/usr/bin/env bash
set -euo pipefail
: "${SMART_AI_ADAPTER_CONFIG_URL:?SMART_AI_ADAPTER_CONFIG_URL is required}"
: "${SMART_AI_ADAPTER_WEIGHTS_URL:?SMART_AI_ADAPTER_WEIGHTS_URL is required}"
BASE_MODEL="${SMART_AI_BASE_MODEL:-Qwen/Qwen3-4B}"
ADAPTER_DIR="/models/smart-ai-v2-super"
mkdir -p "$ADAPTER_DIR"
curl -fsSL --retry 5 --retry-all-errors "$SMART_AI_ADAPTER_CONFIG_URL" -o "$ADAPTER_DIR/adapter_config.json"
curl -fsSL --retry 5 --retry-all-errors "$SMART_AI_ADAPTER_WEIGHTS_URL" -o "$ADAPTER_DIR/adapter_model.safetensors"
python - <<'PY'
import json, os
p='/models/smart-ai-v2-super/adapter_config.json'
c=json.load(open(p,encoding='utf-8'))
assert c.get('base_model_name_or_path') == os.environ.get('SMART_AI_BASE_MODEL','Qwen/Qwen3-4B'), c
assert c.get('peft_type') == 'LORA'
assert int(c.get('r',0)) <= 64
print('SMART AI V2 adapter verified:', c.get('base_model_name_or_path'), 'r=', c.get('r'))
PY
exec vllm serve "$BASE_MODEL" \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --enable-lora \
  --max-lora-rank 64 \
  --lora-modules "smart-ai-v2-super=$ADAPTER_DIR" \
  --max-model-len "${SMART_AI_MAX_MODEL_LEN:-4096}" \
  --gpu-memory-utilization "${SMART_AI_GPU_MEMORY_UTILIZATION:-0.90}"
