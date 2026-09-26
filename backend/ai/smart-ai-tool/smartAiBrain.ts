import { checkPermission } from "./permissions.js";
import { web_search } from "./webSearch.js";
import { solve_emotional, solve_social, solve_economic } from "./problemSolver.js";
import { generate_excel_report, generate_word_report, generate_pdf_report, generate_chart, draw_plan } from "./reportGenerator.js";
import { detectProblemType } from "./empathyEngine.js";
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

export async function smartAiBrainV3(userId: string, message: string, language: "ar" | "en" = "ar", data: Record<string, unknown> = {}) {
  const toolName = classifyV3(message);
  if (!toolName) return null;
  const definition = v3ToolRegistry[toolName];
  if (definition.permission && !(await checkPermission(userId, definition.permission as any))) {
    return { toolName, requiresPermission: true, reply: language === "ar" ? `محتاج إذن للوصول لـ ${definition.permission} علشان أنفذ الطلب. فعّل الإذن من إعدادات SMART AI.` : `Permission for ${definition.permission} is required.` };
  }
  if (toolName === "web_search") return { toolName, result: await web_search(message, language), reply: "" };
  if (toolName === "solve_emotional_problem") return { toolName, result: await solve_emotional(userId, message), reply: "" };
  if (toolName === "solve_social_problem") return { toolName, result: await solve_social(userId, message), reply: "" };
  if (toolName === "solve_economic_problem") return { toolName, result: await solve_economic(userId, message), reply: "" };
  if (toolName === "generate_excel_report") return { toolName, result: await generate_excel_report(data), reply: "" };
  if (toolName === "generate_word_report") return { toolName, result: await generate_word_report(data), reply: "" };
  if (toolName === "generate_pdf_report") return { toolName, result: await generate_pdf_report(data), reply: "" };
  if (toolName === "generate_chart") return { toolName, result: generate_chart(data.expenses || []), reply: "" };
  if (toolName === "draw_plan") return { toolName, result: draw_plan(message), reply: "" };
  return null;
}
