import { runOpenMindBrain } from "./openMindBrain.js";
import type { SmartAiRequest, SmartAiResponse } from "./types.js";

/**
 * OPEN MIND AI entry point.
 * Understand -> plan -> confirmation/tool boundary -> verified response.
 * Existing SMART TIME deterministic rules remain available in the repository;
 * this entry point establishes the unified orchestration boundary.
 */
export async function askSmartAiCore(request: SmartAiRequest): Promise<SmartAiResponse> {
  const result = await runOpenMindBrain(request);
  return result;
}
