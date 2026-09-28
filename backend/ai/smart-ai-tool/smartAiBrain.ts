import { checkPermission } from "./permissions.js";
import { detectProblemType } from "./empathyEngine.js";
import { executeV3Tool } from "./toolRuntime.js";
import { v3ToolRegistry } from "./toolRegistry.js";
import type { V3ToolName } from "./types.js";

export function classifyV3(message: string): V3ToolName | null {
  const m = String(message || "").toLowerCase();
  if (/ابحث|بحث|مصادر|latest|search|research/.test(m)) return "web_search";
  if (/تقرير.*excel|excel|xlsx/.test(m)) return "generate_excel_report";
  if (/تقرير.*word|word|docx/.test(m)) return "generate_word_report";
  if (/تقرير.*pdf|pdf/.test(m)) return "generate_pdf_report";
  if (/chart|رسم بياني|جراف/.test(m)) return "generate_chart";
  if (/ارسم|مخطط|plan/.test(m)) return "draw_plan";
  const type = detectProblemType(message);
  if (type === "emotional") return "solve_emotional_problem";
  if (type === "social") return "solve_social_problem";
  if (type === "economic") return "solve_economic_problem";
  return null;
}

export async function smartAiBrainV3(
  userId: string,
  message: string,
  language: "ar" | "en" = "ar",
  data: Record<string, unknown> = {},
) {
  const toolName = classifyV3(message);
  if (!toolName) return null;

  const definition = v3ToolRegistry[toolName];

  if (definition.permission && !(await checkPermission(userId, definition.permission as any))) {
    return {
      toolName,
      requiresPermission: true,
      reply:
        language === "ar"
          ? `محتاج إذن للوصول لـ ${definition.permission} علشان أنفذ الطلب. فعّل الإذن من إعدادات SMART AI.`
          : `Permission for ${definition.permission} is required.`,
    };
  }

  const args =
    toolName === "generate_excel_report" ||
    toolName === "generate_word_report" ||
    toolName === "generate_pdf_report"
      ? { data }
      : toolName === "generate_chart"
        ? { expenses: data.expenses || [] }
        : { message };

  const execution = await executeV3Tool(
    { userId, language, canonicalData: data },
    toolName,
    args,
  );

  return {
    toolName,
    result: execution.result,
    execution,
    reply: execution.verified ? "" : execution.error || "",
  };
}
