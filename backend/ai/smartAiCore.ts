import { buildSmartTimeData } from "./appContext.js";
import { answerWithRules } from "./rulesEngine.js";
import type { SmartAiRequest, SmartAiResponse } from "./types.js";

export async function askSmartAiCore(request: SmartAiRequest): Promise<SmartAiResponse> {
  const message = String(request.message || "").trim();
  if (!message) throw new Error("Message is required");
  if (!request.appContext || typeof request.appContext !== "object") {
    throw new Error("بيانات SMART TIME مطلوبة.");
  }

  const data = buildSmartTimeData(request.appContext, message);
  return answerWithRules(message, request.language === "en" ? "en" : "ar", data);
}
