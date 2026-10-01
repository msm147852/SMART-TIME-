const DEFAULT_MODEL = "backend/ai/models/smart-ai-v2-super";

export interface LocalInferenceInput {
  input: string;
  modelPath?: string;
}

export interface LocalInferenceResult {
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
  return Number.isFinite(capability) && capability >= 8.0 ? "bf16" : "fp16";
}

function extractContent(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((part: any) => typeof part?.text === "string" ? part.text : "").join("").trim();
  return "";
}

const SYSTEM_PROMPT = [
  "You are SMART TIME AI V2.",
  "Return exactly one JSON object and nothing else.",
  "Never emit <think>, </think>, markdown fences, explanations, or free text.",
  "Use the V2 structured-output contract only.",
  "The official Qwen3 chat template is used with enable_thinking=false."
].join("\n");

export async function runLocalInference(input: LocalInferenceInput): Promise<LocalInferenceResult> {
  const baseUrl = String(process.env.SMART_AI_LOCAL_URL || "").trim().replace(/\/$/, "");
  if (!baseUrl) throw new Error("SMART_AI_LOCAL_URL is not configured.");

  const modelPath = String(input.modelPath || process.env.SMART_AI_V2_MODEL_PATH || DEFAULT_MODEL).trim();
  const model = String(process.env.SMART_AI_V2_MODEL || process.env.SMART_AI_LOCAL_MODEL || modelPath).trim();
  const token = String(process.env.SMART_AI_LOCAL_TOKEN || "").trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(baseUrl + "/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {})
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.2,
        max_tokens: 700,
        chat_template_kwargs: { enable_thinking: false },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: input.input }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error("Local inference HTTP " + response.status);
    const data = await response.json();
    const raw = extractContent(data);
    if (!raw) throw new Error("Local inference returned empty content.");

    return {
      raw,
      model,
      modelPath,
      runtime: {
        quantization: "4bit-NF4-double-quant",
        computeDtype: computeDtype(),
        capability: Number.isFinite(Number(process.env.SMART_AI_GPU_CAPABILITY)) ? Number(process.env.SMART_AI_GPU_CAPABILITY) : null,
        enableThinking: false
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}
