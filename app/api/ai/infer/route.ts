import { groqProvider } from "../../../../backend/ai/providers/groqProvider.js";
import { validateV2Output } from "../../../../backend/ai/training/v2StructuredOutput.js";
import { executeToolAction } from "../../../../backend/ai/toolExecutor.js";

const GROQ_CHAT_MODEL = String(process.env.GROQ_CHAT_MODEL || process.env.GROQ_MODEL || "openai/gpt-oss-120b").trim();
const DEFAULT_USER_ID = "smart-time-trial-user";
const MUTATING_TOOLS = new Set(["add_expense", "add_daily_task", "calendar.event.create"]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

function meta(model: string, attempts: number) { return { model, runtime: { source: "groq", provider: "groq" }, retryAttempts: attempts }; }

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const input = String(body?.input ?? body?.prompt ?? "").trim();
    if (!input) return json({ error: "input is required" }, 400);
    if (input.length > 4000) return json({ error: "input is too long" }, 413);

    const confirmed = body?.confirmed === true;
    const userId = String(body?.userId || DEFAULT_USER_ID).trim() || DEFAULT_USER_ID;
    const system = [
      "You are SMART TIME AI, the conversational assistant for the SMART TIME app.",
      "Speak naturally in Egyptian Arabic when the user speaks Arabic. Do not use canned phrases unless appropriate.",
      "Understand the actual request and context. Vary wording naturally.",
      "Never claim an action was completed unless a tool result confirms it.",
      "For actions, return exactly one JSON object with keys tool and arguments and optionally reply.",
      "Allowed tools: clarification, unsupported, add_expense, add_daily_task, calendar.event.create.",
      "Mutation tools require explicit confirmation from the user before execution.",
    ].join("\n");
    const messages = Array.isArray(body?.messages) && body.messages.length
      ? body.messages.map((message: any) => ({
          role: message?.role === "assistant" ? "assistant" : "user",\n          content: String(message?.content ?? message?.text ?? "").trim(),\n        })).filter((message: { content: string }) => message.content)\n      : [{ role: "user" as const, content: input }];
    let attempts = 0;
    let raw = "";
    try {
      const response = await groqProvider.chat({
        model: GROQ_CHAT_MODEL,
        messages: [{ role: "system", content: system }, ...messages],
        temperature: 0.7,
        maxCompletionTokens: 700,
      });
      attempts = 1;
      raw = response.content;
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Groq chat failed", provider: "groq", ...meta(GROQ_CHAT_MODEL, attempts) }, 502);
    }
    let parsed: any = null;
    try {
      const clean = raw.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch { parsed = { tool: "clarification", arguments: {}, reply: raw }; }
    if (!parsed || typeof parsed !== "object" || typeof parsed.tool !== "string") parsed = { tool: "clarification", arguments: {}, reply: raw };
    if (parsed.tool === "clarification" || parsed.tool === "unsupported") return json({ result: parsed, routed: false, executed: false, degraded: false, ...meta(GROQ_CHAT_MODEL, attempts) });
    const validation = validateV2Output(JSON.stringify(parsed));
    if (!validation.valid || !validation.parsed) return json({ result: { tool: "clarification", arguments: {}, reply: parsed.reply || raw }, routed: false, executed: false, validation, ...meta(GROQ_CHAT_MODEL, attempts) });
    const result = validation.parsed;
    if (MUTATING_TOOLS.has(result.tool) && !confirmed) return json({ result, validation, routed: true, executed: false, requiresConfirmation: true, confirmationReason: "Mutation requires explicit confirmation.", ...meta(GROQ_CHAT_MODEL, attempts) });
    if (result.tool === "add_expense" || result.tool === "add_daily_task") {
      const toolResult = executeToolAction(userId, { type: result.tool, payload: result.arguments || {} } as any);
      const verified = toolResult.ok === true && toolResult.verification?.persisted === true;
      if (!verified) return json({ result, validation, routed: true, executed: false, routerStatus: "backend_verification_failed", toolResult, ...meta(GROQ_CHAT_MODEL, attempts) }, 502);
      return json({ result, validation, routed: true, executed: true, toolResult, ...meta(GROQ_CHAT_MODEL, attempts) });
    }
    if (result.tool === "calendar.event.create") return json({ result, validation, routed: true, executed: false, requiresConfirmation: false, routerStatus: "calendar_executor_not_implemented", ...meta(GROQ_CHAT_MODEL, attempts) }, 501);
    return json({ result, validation, routed: true, executed: false, routerStatus: "read_only_finance_boundary", ...meta(GROQ_CHAT_MODEL, attempts) });

  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "SMART TIME inference failed", retry: false, provider: "groq" }, 500);
  }
}
