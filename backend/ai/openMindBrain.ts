import { buildSmartTimeData } from "./appContext.js";
import { askLocalSmartAi, isLocalSmartAiConfigured } from "./localInference.js";
import type { SmartAiAction, SmartAiRequest, SmartAiResponse } from "./types.js";

export type BrainIntent =
  | "conversation"
  | "social_emotional"
  | "economic_analysis"
  | "web_research"
  | "report_generation"
  | "cad_analysis"
  | "speed_estimation"
  | "maps"
  | "app_action"
  | "unknown";

export interface BrainPlan {
  intent: BrainIntent;
  steps: string[];
  requiresConfirmation: boolean;
  action: SmartAiAction;
  factsRequired: string[];
}

const NO_INVENTION = "Never invent facts, numbers, tool results, locations, files, execution status, or measurements. If required evidence is missing, say so and ask for it.";

export function classifyIntent(message: string): BrainIntent {
  const m = message.toLowerCase();
  if (/بحث|ابحث|مصادر|آخر|latest|search|research/.test(m)) return "web_research";
  if (/pdf|تقرير|report|excel|xlsx|word|docx/.test(m)) return "report_generation";
  if (/dwg|dxf|cad|كاد|لوحة هندسية/.test(m)) return "cad_analysis";
  if (/فيديو|سرعة|speed|opencv|yolo|رياح|دخان/.test(m)) return "speed_estimation";
  if (/خريطة|خرائط|maps|مسافة|طريق|route|coordinates|إحداثيات/.test(m)) return "maps";
  if (/مصروف|ميزانية|دخل|جدوى|اقتصاد|budget|expense|finance/.test(m)) return "economic_analysis";
  if (/علاقة|توتر|قلق|مشكلة|مشاعر|زعلان|خلاف|relationship|stress/.test(m)) return "social_emotional";
  if (/سجل|أضف|احذف|عدّل|غير|نفذ|execute|add|delete|update/.test(m)) return "app_action";
  return "conversation";
}

export function planRequest(request: SmartAiRequest): BrainPlan {
  const intent = classifyIntent(request.message);
  const mutating = intent === "app_action" || /احذف|امسح|عدّل|غيّر|سجّل|أضف|delete|update|change|add/.test(request.message.toLowerCase());
  const steps = intent === "web_research"
    ? ["identify the research question", "retrieve external sources", "summarize with source attribution"]
    : intent === "report_generation"
      ? ["validate source data", "generate requested artifact", "verify the output file exists"]
      : intent === "cad_analysis"
        ? ["validate DXF/DWG input", "extract geometry/metadata", "render supported geometry", "explain with evidence"]
        : intent === "speed_estimation"
          ? ["validate video and calibration inputs", "track objects/flow", "estimate speed with stated assumptions", "report uncertainty"]
          : intent === "maps"
            ? ["validate coordinates", "query Google Maps service", "calculate distance/route from returned data"]
            : ["understand request", "collect missing facts", "perform deterministic/tool-backed work", "verify result"];

  return {
    intent,
    steps,
    requiresConfirmation: mutating,
    action: null,
    factsRequired: intent === "maps" ? ["origin", "destination or coordinates"] : []
  };
}

export async function runOpenMindBrain(request: SmartAiRequest): Promise<SmartAiResponse & { plan: BrainPlan }> {
  const message = String(request.message || "").trim();
  if (!message) throw new Error("Message is required");
  const data = buildSmartTimeData(request.appContext || {}, message);
  const plan = planRequest(request);
  const language = request.language === "en" ? "en" : "ar";

  if (plan.intent === "app_action" && plan.requiresConfirmation) {
    return {
      reply: language === "ar" ? "أقدر أنفذ التغيير، لكن أحتاج تأكيدك قبل التنفيذ. لن أدّعي أن العملية تمت قبل التحقق من نتيجتها." : "I can perform the change, but I need your confirmation first. I will not claim success until the result is verified.",
      action: null,
      actionSummary: "confirmation_required",
      requiresConfirmation: true,
      needsClarification: false,
      provider: "smart-ai",
      model: "open-mind-brain",
      engine: "rules",
      plan
    };
  }

  if (isLocalSmartAiConfigured()) {
    try {
      const local = await askLocalSmartAi({
        language,
        message: `${NO_INVENTION}\nIntent: ${plan.intent}\nPlan: ${plan.steps.join(" -> ")}\nApp data: ${JSON.stringify(data)}\nUser: ${message}`,
        data,
        conversationHistory: Array.isArray(request.conversationHistory) ? request.conversationHistory.slice(-8) : []
      });
      if (local?.reply) return { ...local, requiresConfirmation: plan.requiresConfirmation, plan };
    } catch (error) {
      console.warn("OPEN MIND local model unavailable:", (error as Error)?.message);
    }
  }

  return {
    reply: language === "ar"
      ? `فهمت الطلب كـ${plan.intent}. الخطة: ${plan.steps.join(" → ")}. لا أملك نتيجة أداة موثقة لهذا الطلب داخل المسار الحالي، لذلك لن أخترع نتيجة.`
      : `I classified this as ${plan.intent}. Plan: ${plan.steps.join(" -> ")}. No verified tool result is available in the current path, so I will not invent one.`,
    action: null,
    actionSummary: undefined,
    requiresConfirmation: plan.requiresConfirmation,
    needsClarification: true,
    provider: "smart-ai",
    model: "open-mind-brain",
    engine: "rules",
    plan
  };
}
