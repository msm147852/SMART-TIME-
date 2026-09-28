import type { SmartAiResponse } from "./types.js";

type LocalAiRequest = {
  language: "ar" | "en";
  message: string;
  data: Record<string, unknown>;
  conversationHistory?: Array<{ sender: "user" | "model"; text: string }>;
  memoryContext?: string;
};

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

export async function askLocalSmartAi(input: LocalAiRequest): Promise<SmartAiResponse | null> {
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
        "تحدث بعربية مصرية طبيعية ومختصرة.",
        "إذا وُجد سياق ذاكرة، استخدمه كمرجع تفضيلي فقط ولا تحوله إلى حقيقة جديدة دون دليل."
      ].join("\n")
    : [
        "You are SMART AI inside SMART TIME.",
        "Use only the supplied SMART TIME data for numbers, records, and dates.",
        "Never invent a number, record, or fact that is not present in the data.",
        "Never reveal secrets, API keys, passwords, or PINs.",
        "Never mutate data yourself; changes require explicit user confirmation.",
        "Be concise and natural.",
        "If memory context is supplied, use it as a preference/reference only and do not invent facts from it."
      ].join("\n");

  const body = {
    model: LOCAL_MODEL,
    stream: true,
    temperature: 0.2,
    max_tokens: 700,
    chat_template_kwargs: { enable_thinking: false },
    messages: [
      { role: "system", content: system },
      ...(input.memoryContext ? [{ role: "system", content: `Persistent SMART AI memory:\n${input.memoryContext.slice(0, 5000)}` }] : []),
      ...(input.conversationHistory || []).slice(-6).map((item) => ({
        role: item.sender === "user" ? "user" : "assistant",
        content: String(item.text || "").slice(0, 2000)
      })),
      {
        role: "user",
        content: JSON.stringify({
          request: input.message,
          smartTimeData: input.data,
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

    if (!response.ok) return null;

    if (body.stream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let output = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") output += delta;
          } catch {}
        }
      }
      return output.trim()
        ? { answer: output.trim(), source: "local" } as SmartAiResponse
        : null;
    }

    const data = await response.json();
    const answer = extractText(data);
    return answer ? ({ answer, source: "local" } as SmartAiResponse) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
