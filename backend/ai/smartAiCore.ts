import { buildSmartTimeData } from "./appContext.js";
import { askLocalSmartAi, isLocalSmartAiConfigured } from "./localInference.js";
import { answerWithRules } from "./rulesEngine.js";
import type { SmartAiRequest, SmartAiResponse } from "./types.js";

export async function askSmartAiCore(request: SmartAiRequest): Promise<SmartAiResponse> {
  const message = String(request.message || "").trim();
  if (!message) throw new Error("Message is required");
  if (!request.appContext || typeof request.appContext !== "object") {
    throw new Error("بيانات SMART TIME مطلوبة.");
  }

  const data = buildSmartTimeData(request.appContext, message);
  const language = request.language === "en" ? "en" : "ar";
  const ruleResponse = answerWithRules(message, language, data);

  // Known SMART TIME intents stay deterministic. A local model is only used
  // for open-ended conversation when one is explicitly configured.
  if (isLocalSmartAiConfigured() && ruleResponse.needsClarification) {
    try {
      const localResponse = await askLocalSmartAi({ language, message, data });
      if (localResponse?.reply) return localResponse;
    } catch (error) {
      console.warn("Local SMART AI unavailable; keeping deterministic fallback:", (error as Error)?.message);
    }
  }

  return ruleResponse;
}
