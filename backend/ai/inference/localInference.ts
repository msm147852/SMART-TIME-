const DEFAULT_MODEL_PATH = "backend/ai/models/smart-ai-v2-super";

export interface RunLocalInferenceInput { input: string; modelPath?: string; }
export interface RunLocalInferenceResult {
  raw: string; model: string; modelPath: string;
  runtime: { quantization: "4bit-NF4-double-quant"; computeDtype: "bf16" | "fp16"; capability: number | null; enableThinking: false; };
}

function extractText(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((p: any) => typeof p?.text === "string" ? p.text : "").join("").trim();
  return "";
}
function computeDtype(): "bf16" | "fp16" {
  const capability = Number(process.env.SMART_AI_GPU_CAPABILITY || "");
  return Number.isFinite(capability) && capability >= 8 ? "bf16" : "fp16";
}

export async function runLocalInference(input: RunLocalInferenceInput): Promise<RunLocalInferenceResult> {
  const url = String(process.env.SMART_AI_LOCAL_URL || "").trim().replace(/\/$/, "");
  if (!url) throw new Error("SMART_AI_LOCAL_URL is not configured.");
  const modelPath = input.modelPath || process.env.SMART_AI_V2_MODEL_PATH || DEFAULT_MODEL_PATH;
  const model = String(process.env.SMART_AI_V2_MODEL || process.env.SMART_AI_LOCAL_MODEL || modelPath);
  const token = String(process.env.SMART_AI_LOCAL_TOKEN || "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: JSON.stringify({
        model, stream: false, temperature: 0.2, max_tokens: 700,
        chat_template_kwargs: { enable_thinking: false },
        messages: [
          { role: "system", content: "You are SMART TIME. Return exactly one JSON object and nothing else. Never emit <think>, </think>, markdown fences, or free text. Use the SMART TIME V2 structured-output contract." },
          { role: "user", content: input.input }
        ]
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error("Local SMART AI HTTP " + response.status);
    const raw = extractText(await response.json());
    if (!raw) throw new Error("Local SMART AI returned empty output.");
    return {
      raw, model, modelPath,
      runtime: {
        quantization: "4bit-NF4-double-quant",
        computeDtype: computeDtype(),
        capability: Number.isFinite(Number(process.env.SMART_AI_GPU_CAPABILITY)) ? Number(process.env.SMART_AI_GPU_CAPABILITY) : null,
        enableThinking: false
      }
    };
  } finally { clearTimeout(timeout); }
}
