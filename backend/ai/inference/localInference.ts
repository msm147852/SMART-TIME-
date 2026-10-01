import { runLocalInference as runExistingLocalInference } from "../localInference.js";

export interface RunLocalInferenceInput {
  input: string;
  modelPath?: string;
}

export interface RunLocalInferenceResult {
  raw: string;
  model: string;
  modelPath: string;
  runtime: {
    quantization: "4bit-NF4-double-quant";
    computeDtype: "bf16" | "fp16";
    capability: number | null;
    enableThinking: false;
  };
}

function computeDtype(): "bf16" | "fp16" {
  const capability = Number(process.env.SMART_AI_GPU_CAPABILITY || "");
  return Number.isFinite(capability) && capability >= 8 ? "bf16" : "fp16";
}

export async function runLocalInference(input: RunLocalInferenceInput): Promise<RunLocalInferenceResult> {
  // Keep the existing local inference transport and official Qwen3 template
  // settings in one place; the V2 adapter only adds the JSON contract metadata.
  const result = await runExistingLocalInference({
    language: "ar",
    message: input.input,
    data: {
      modelPath: input.modelPath || "backend/ai/models/smart-ai-v2-super",
      v2: true,
      jsonOnly: true
    }
  });

  const raw = result?.reply?.trim();
  if (!raw) throw new Error("Local SMART AI returned empty output.");

  return {
    raw,
    model: result.model || String(process.env.SMART_AI_LOCAL_MODEL || "smart-time-local"),
    modelPath: input.modelPath || "backend/ai/models/smart-ai-v2-super",
    runtime: {
      quantization: "4bit-NF4-double-quant",
      computeDtype: computeDtype(),
      capability: Number.isFinite(Number(process.env.SMART_AI_GPU_CAPABILITY))
        ? Number(process.env.SMART_AI_GPU_CAPABILITY)
        : null,
      enableThinking: false
    }
  };
}
