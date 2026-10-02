import { runLocalInference } from "../../../../backend/ai/inference/localInference.js";
import { validateV2Output } from "../../../../backend/ai/training/v2StructuredOutput.js";
import { executeToolAction } from "../../../../backend/ai/toolExecutor.js";
import { buildSmartTimeData } from "../../../../backend/ai/appContext.js";
import { answerWithRules } from "../../../../backend/ai/rulesEngine.js";

const DATASET_SHA = "a6b0fc5461df86d9e175654b2e5ff156903aa552";
const MODEL_PATH = "backend/ai/models/smart-ai-v2-super";
const DEFAULT_USER_ID = "smart-time-trial-user";
const MUTATING_TOOLS = new Set(["add_expense", "add_daily_task", "calendar.event.create"]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function meta(inference: Awaited<ReturnType<typeof runLocalInference>>, attempts: number) {
  return { model: inference.model, modelPath: inference.modelPath, runtime: inference.runtime, retryAttempts: attempts, datasetSha: DATASET_SHA };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const input = String(body?.input ?? body?.prompt ?? "").trim();
    if (!input) return json({ error: "input is required" }, 400);
    if (input.length > 4000) return json({ error: "input is too long" }, 413);

    const confirmed = body?.confirmed === true;
    const userId = String(body?.userId || DEFAULT_USER_ID).trim() || DEFAULT_USER_ID;

    // The preview/public SMART AI demo must remain conversational even when
    // the optional local Qwen/vLLM runtime is not provisioned. Never fabricate
    // a model result: use the verified app-owned rules engine as an explicit
    // degraded response and expose the degraded flag to the UI.
    if (!String(process.env.SMART_AI_LOCAL_URL || "").trim() && !confirmed) {
      const appData = buildSmartTimeData({}, input);
      const fallback = answerWithRules(input, "ar", appData);
      const result = {
        tool: "clarification",
        arguments: {},
        reply: fallback.reply,
      };
      return json({
        result,
        routed: false,
        executed: false,
        degraded: true,
        degradedReason: "SMART_AI_LOCAL_URL is not configured; app-owned rules response used.",
        model: fallback.model || "smart-time-core",
        runtime: { source: "app-owned-rules", enableThinking: false },
      });
    }

    let inference: Awaited<ReturnType<typeof runLocalInference>>;
    let validation: ReturnType<typeof validateV2Output>;
    let attempts = 0;

    if (confirmed && body?.confirmedResult) {
      validation = validateV2Output(JSON.stringify(body.confirmedResult));
      if (!validation.valid || !validation.parsed) return json({ error: "Confirmed result failed V2 validation; nothing was executed.", validation, routed: false, executed: false, datasetSha: DATASET_SHA }, 422);
      if (!MUTATING_TOOLS.has(validation.parsed.tool)) return json({ error: "Confirmed result is not a mutation.", validation, routed: false, executed: false, datasetSha: DATASET_SHA }, 400);
      inference = await runLocalInference({ input, modelPath: MODEL_PATH, retryHint: "Confirmation path: the supplied JSON was revalidated before execution." });
      attempts = 1;
    } else {
      inference = await runLocalInference({ input, modelPath: MODEL_PATH });
      attempts = 1;
      validation = validateV2Output(inference.raw);
      if (!validation.valid || !validation.parsed) {
        inference = await runLocalInference({ input, modelPath: MODEL_PATH, retryHint: "Your previous response failed the SMART TIME V2 schema. Correct it now. Output exactly one valid JSON object, no <think>, no markdown, no extra keys." });
        attempts = 2;
        validation = validateV2Output(inference.raw);
      }
    }

    if (!validation.valid || !validation.parsed) return json({ error: "V2 validation failed after bounded local retry; nothing was routed or executed.", retry: false, validation, raw: inference.raw, ...meta(inference, attempts) }, 422);

    const result = validation.parsed;
    if (result.tool === "clarification" || result.tool === "unsupported") return json({ result, validation, routed: false, executed: false, ...meta(inference, attempts) });

    if (MUTATING_TOOLS.has(result.tool) && !confirmed) return json({ result, validation, routed: true, executed: false, requiresConfirmation: true, confirmationReason: "Mutation requires explicit confirmation.", ...meta(inference, attempts) });

    if (result.tool === "add_expense" || result.tool === "add_daily_task") {
      const toolResult = executeToolAction(userId, { type: result.tool, payload: result.arguments || {} } as any);
      const verified = toolResult.ok === true && toolResult.verification?.persisted === true;
      if (!verified) return json({ result, validation, routed: true, executed: false, routerStatus: "backend_verification_failed", toolResult, ...meta(inference, attempts) }, 502);
      return json({ result, validation, routed: true, executed: true, toolResult, ...meta(inference, attempts) });
    }

    if (result.tool === "calendar.event.create") return json({ result, validation, routed: true, executed: false, requiresConfirmation: false, routerStatus: "calendar_executor_not_implemented", ...meta(inference, attempts) }, 501);

    return json({ result, validation, routed: true, executed: false, routerStatus: "read_only_finance_boundary", ...meta(inference, attempts) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "SMART TIME inference failed", retry: false, datasetSha: DATASET_SHA }, 500);
  }
}
