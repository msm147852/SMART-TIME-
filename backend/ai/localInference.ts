import type { SmartAiResponse } from "./types.js";

const LOCAL_URL = String(process.env.SMART_AI_LOCAL_URL || "").trim().replace(/\/$/, "");
const LOCAL_MODEL = String(process.env.SMART_AI_LOCAL_MODEL || "smart-time-local").trim();
const LOCAL_TOKEN = String(process.env.SMART_AI_LOCAL_TOKEN || "").trim();

export function isLocalSmartAiConfigured(): boolean {
  return Boolean(LOCAL_URL);
}

function extractText(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part: any) => typeof part?.text === "string" ? part.text : "")
      .join("")
      .trim();
  }
  return "";
}

export async function askLocalSmartAi(input: {
  language: "ar" | "en";
  message: string;
  data: Record<string, unknown>;
  conversationHistory?: Array<{ sender: "user" | "model"; text: string }>;
}): Promise<SmartAiResponse | null> {
  if (!LOCAL_URL) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  const system = input.language === "ar"
    ? [
        "أنت SMART AI داخل تطبيق SMART TIME.",
        "استخدم بيانات SMART TIME المرفقة فقط عند الحديث عن أرقام أو سجلات أو تواريخ.",
        "لا تخترع أي رقم أو سجل أو حقيقة غير موجودة في البيانات.",
        "لا تكشف أسرارًا أو مفاتيح API أو كلمات مرور أو PIN.",
        "لا تنفذ أي تعديل على البيانات من نفسك؛ أي تعديل يحتاج تأكيد المستخدم.",
        "تحدث بعربية مصرية طبيعية ومختصرة."
      ].join("\n")
    : [
        "You are SMART AI inside SMART TIME.",
        "Use only the supplied SMART TIME data for numbers, records, and dates.",
        "Never invent a number, record, or fact that is not present in the data.",
        "Never reveal secrets, API keys, passwords, or PINs.",
        "Never mutate data yourself; changes require explicit user confirmation.",
        "Be concise and natural."
      ].join("\n");

  const body = {
    model: LOCAL_MODEL,
    stream: false,
    temperature: 0.2,
    max_tokens: 700,
    messages: [
      { role: "system", content: system },
      ...(input.conversationHistory || []).slice(-6).map((item) => ({
        role: item.sender === "user" ? "user" : "assistant",
        content: String(item.text || "").slice(0, 2000)
      })),
      {
        role: "user",
        content: JSON.stringify({
          request: input.message,
          smartTimeData: input.data
        })
      }
    ]
  };

  try {
    const response = await fetch(`${LOCAL_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(LOCAL_TOKEN ? { Authorization: `Bearer ${LOCAL_TOKEN}` } : {})
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Local SMART AI HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = extractText(data);
    if (!reply) throw new Error("Local SMART AI returned an empty response.");

    return {
      reply,
      action: null,
      requiresConfirmation: false,
      needsClarification: false,
      provider: "smart-ai",
      model: LOCAL_MODEL,
      engine: "local"
    };
  } finally {
    clearTimeout(timeout);
  }
}
