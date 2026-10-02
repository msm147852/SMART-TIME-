# SMART AI V2 GPU inference provider

This service is the runtime bridge between the trained Kaggle LoRA artifact and the Node/Railway app.

It serves Qwen/Qwen3-4B plus the smart-ai-v2-super LoRA through the OpenAI-compatible /v1/chat/completions API. The adapter is downloaded at container startup from explicit artifact URLs; no placeholder weights are accepted.

## Required environment
- SMART_AI_ADAPTER_CONFIG_URL — raw URL for the trained adapter_config.json.
- SMART_AI_ADAPTER_WEIGHTS_URL — raw URL for the trained adapter_model.safetensors.
- SMART_AI_BASE_MODEL — defaults to Qwen/Qwen3-4B.
- SMART_AI_GPU_MEMORY_UTILIZATION — optional, defaults to 0.90.
- SMART_AI_MAX_MODEL_LEN — optional, defaults to 4096.

The repository artifact is Git LFS-backed, so the URLs must resolve to the real binary, not the LFS pointer text.

## Contract
Use model name smart-ai-v2-super. The server exposes /v1/chat/completions expected by backend/ai/inference/localInference.ts.

Qwen3-4B is an 8.06 GB base model on Hugging Face, so this service requires a GPU deployment rather than Railway's CPU runtime.