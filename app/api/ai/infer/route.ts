import { runLocalInference } from "../../../../backend/ai/inference/localInference.js";
import { validateV2Output } from "../../../../backend/ai/training/v2StructuredOutput.js";
import { executeToolAction } from "../../../../backend/ai/toolExecutor.js";
import { createCalendarEvent } from "../../../../backend/ai/calendar/eventExecutor.js";

const DATASET_SHA = "a6b0fc5461df86d9e175654b2e5ff156903aa552";
const DEFAULT_USER_ID = String(process.env.SMART_AI_DEFAULT_USER_ID || "smart-time-trial-user");
const MUTATING_TOOLS = new Set(["add_expense", "add_daily_task", "calendar.event.create"]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const input = String(body?.input ?? body?.prompt ?? "").trim();
    if (!input) return json({ error: "input is required" }, 400);
    if (input.length > 4000) return json({ error: "input is too long" }, 413);

    const confirmed = body?.confirmed === true;
    const userId = String(body?.userId || DEFAULT_USER_ID).trim() || DEFAULT_USER_ID;
    const inference = await runLocalInference({ input, modelPath: "backend/ai/models/smart-ai-v2-super" });
    const validation = validateV2Output(inference.raw);

    if (!validation.valid || !validation.parsed) {
      return json({ error: "V2 validation failed", retry: true, validation, raw: inference.raw, model: inference.model, modelPath: inference.modelPath, runtime: inference.runtime, datasetSha: DATASET_SHA }, 422);
    }

    const parsed = validation.parsed;
    if (parsed.tool === "clarification" || parsed.tool === "unsupported") {
      return json({ result: parsed, validation, routed: false, model: inference.model, modelPath: inference.modelPath, runtime: inference.runtime, datasetSha: DATASET_SHA });
    }

    if (MUTATING_TOOLS.has(parsed.tool) && !confirmed) {
      return json({ result: parsed, validation, routed: true, executed: false, requiresConfirmation: true, confirmationReason: "Mutation requires explicit confirmation.", model: inference.model, modelPath: inference.modelPath, runtime: inference.runtime, datasetSha: DATASET_SHA });
    }

    let toolResult: unknown;
    if (parsed.tool === "add_expense" || parsed.tool === "add_daily_task") {
      toolResult = executeToolAction(userId, { type: parsed.tool, payload: parsed.arguments || {} } as any);
    } else if (parsed.tool === "calendar.event.create") {
      toolResult = createCalendarEvent(userId, parsed.arguments || {});
    } else {
      toolResult = { routed: true, executed: false, reason: "read_only_tool_router_boundary" };
    }

    return json({ result: parsed, validation, routed: true, executed: true, toolResult, model: inference.model, modelPath: inference.modelPath, runtime: inference.runtime, datasetSha: DATASET_SHA });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "SMART TIME inference failed", retry: true, datasetSha: DATASET_SHA }, 500);
  }
}