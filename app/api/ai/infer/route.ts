import { runLocalInference } from "../../../../backend/ai/inference/localInference.js";
import { validateV2Output } from "../../../../backend/ai/training/v2StructuredOutput.js";
import { executeToolAction } from "../../../../backend/ai/toolExecutor.js";

const DATASET_SHA = "a6b0fc5461df86d9e175654b2e5ff156903aa552";
const DEFAULT_USER_ID = "smart-time-trial-user";
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
      return json({
        error: "V2 validation failed",
        retry: true,
        validation,
        raw: inference.raw,
        model: inference.model,
        modelPath: inference.modelPath,
        runtime: inference.runtime,
        datasetSha: DATASET_SHA
      }, 422);
    }

    const result = validation.parsed;
    if (result.tool === "clarification" || result.tool === "unsupported") {
      return json({ result, validation, routed: false, executed: false, datasetSha: DATASET_SHA, model: inference.model, modelPath: inference.modelPath, runtime: inference.runtime });
    }

    if (MUTATING_TOOLS.has(result.tool) && !confirmed) {
      return json({
        result,
        validation,
        routed: true,
        executed: false,
        requiresConfirmation: true,
        confirmationReason: "Mutation requires explicit confirmation.",
        datasetSha: DATASET_SHA,
        model: inference.model,
        modelPath: inference.modelPath,
        runtime: inference.runtime
      });
    }

    // Existing verified Tool Router boundary.
    // Finance mutation -> canonical finance repository through toolExecutor.
    // Reminder/task -> canonical ai_tasks through toolExecutor.
    // Calendar currently has a validated contract but no calendar DB executor in this branch,
    // so never claim execution until that executor exists.
    if (result.tool === "add_expense" || result.tool === "add_daily_task") {
      const toolResult = executeToolAction(userId, { type: result.tool, payload: result.arguments || {} } as any);
      return json({ result, validation, routed: true, executed: true, toolResult, datasetSha: DATASET_SHA, model: inference.model, modelPath: inference.modelPath, runtime: inference.runtime });
    }

    if (result.tool === "calendar.event.create") {
      return json({
        result,
        validation,
        routed: true,
        executed: false,
        requiresConfirmation: false,
        routerStatus: "calendar_executor_not_implemented",
        datasetSha: DATASET_SHA,
        model: inference.model,
        modelPath: inference.modelPath,
        runtime: inference.runtime
      }, 501);
    }

    // Read-only finance tools are schema-routed; execution remains owned by their
    // existing finance read boundary rather than fabricating a result here.
    return json({
      result,
      validation,
      routed: true,
      executed: false,
      routerStatus: "read_only_finance_boundary",
      datasetSha: DATASET_SHA,
      model: inference.model,
      modelPath: inference.modelPath,
      runtime: inference.runtime
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "SMART TIME inference failed", retry: true, datasetSha: DATASET_SHA }, 500);
  }
}
