"use client";

import { FormEvent, useEffect, useState } from "react";

type InferenceResponse = {
  result?: unknown;
  output?: unknown;
  json?: unknown;
  data?: unknown;
  valid?: boolean;
  schemaValid?: boolean;
  validation?: unknown;
  [key: string]: unknown;
};

function formatJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
}

function extractResult(payload: InferenceResponse) {
  return payload.result ?? payload.output ?? payload.json ?? payload.data ?? payload;
}

function getValidationStatus(payload: InferenceResponse, result: unknown) {
  if (typeof payload.schemaValid === "boolean") return payload.schemaValid;
  if (typeof payload.valid === "boolean") return payload.valid;

  if (typeof payload.validation === "boolean") return payload.validation;
  if (payload.validation && typeof payload.validation === "object") {
    const validation = payload.validation as Record<string, unknown>;
    if (typeof validation.valid === "boolean") return validation.valid;
    if (typeof validation.schemaValid === "boolean") return validation.schemaValid;
  }

  try {
    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    return Boolean(
      parsed &&
        typeof parsed === "object" &&
        "intent" in (parsed as Record<string, unknown>) &&
        "tool" in (parsed as Record<string, unknown>) &&
        "arguments" in (parsed as Record<string, unknown>) &&
        "requiresConfirmation" in (parsed as Record<string, unknown>),
    );
  } catch {
    return false;
  }
}

export default function SmartAIDemo() {
  useEffect(() => {
    document.title = "SMART TIME";
  }, []);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<unknown>(null);
  const [validation, setValidation] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt || loading) return;

    setLoading(true);
    setError("");
    setOutput(null);
    setValidation(null);

    try {
      const response = await fetch("/api/ai/infer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: prompt, prompt }),
      });

      const payload = (await response.json()) as InferenceResponse;

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "تعذر تشغيل خدمة الـ AI.",
        );
      }

      const result = extractResult(payload);
      setOutput(result);
      setValidation(getValidationStatus(payload, result));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "حدث خطأ غير متوقع أثناء الاتصال بالخدمة.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/30 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="جرب: سجلي 100 جنيه منظفات"
            dir="rtl"
            className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-[#0a0a0a] px-5 text-base text-white outline-none placeholder:text-white/30 transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
            aria-label="طلب Smart AI"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="min-h-14 rounded-2xl bg-white px-7 font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "جاري التحويل..." : "حول لـ JSON"}
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/45">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          POST /api/ai/infer
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          JSON-Only
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm leading-7 text-red-200"
        >
          {error}
        </div>
      )}

      {output !== null && !error && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#070707]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-white">النتيجة</p>
              <p className="mt-1 text-xs text-white/35">Structured JSON response</p>
            </div>

            <span
              className={[
                "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
                validation
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-300",
              ].join(" ")}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {validation ? "Schema Valid" : "Schema يحتاج مراجعة"}
            </span>
          </div>

          <pre
            dir="ltr"
            className="max-h-[520px] overflow-auto p-5 text-left text-xs leading-7 text-white/80 sm:text-sm"
          >
            {formatJson(output)}
          </pre>
        </div>
      )}

      <div className="mt-7 border-t border-white/10 pt-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
          Service pipeline
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          {[
            "Qwen3-4B V2 (r=64)",
            "JSON",
            "Validation",
            "Tool Router",
            "DB",
          ].map((step, index, steps) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/70">
                {step}
              </span>
              {index < steps.length - 1 && (
                <span className="text-white/25" aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
