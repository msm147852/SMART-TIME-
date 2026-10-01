import { FormEvent, useEffect, useState } from "react";

type InferenceResponse = {
  result?: unknown;
  validation?: unknown;
  routed?: boolean;
  executed?: boolean;
  requiresConfirmation?: boolean;
  routerStatus?: string;
  retryAttempts?: number;
  [key: string]: unknown;
};

function formatJson(value: unknown) {
  if (typeof value === "string") {
    try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
  }
  return JSON.stringify(value, null, 2);
}

function isValid(payload: InferenceResponse) {
  return Boolean(payload.validation && typeof payload.validation === "object" && (payload.validation as Record<string, unknown>).valid === true);
}

function isMutation(result: unknown) {
  const tool = result && typeof result === "object" ? (result as Record<string, unknown>).tool : undefined;
  return tool === "add_expense" || tool === "add_daily_task" || tool === "calendar.event.create";
}

export default function SmartAIDemo() {
  useEffect(() => { document.title = "SMART TIME"; }, []);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<unknown>(null);
  const [validation, setValidation] = useState<boolean | null>(null);
  const [routed, setRouted] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("جاهز");

  async function requestInference(confirmed = false) {
    const prompt = input.trim();
    if (!prompt) return;
    setLoading(!confirmed);
    setConfirming(confirmed);
    setError("");
    setStatus(confirmed ? "جاري تأكيد التنفيذ..." : "جاري inference → validation...");
    if (!confirmed) {
      setOutput(null); setValidation(null); setRouted(false); setExecuted(false); setRequiresConfirmation(false);
    }
    try {
      const body: Record<string, unknown> = { input: prompt, confirmed };
      if (confirmed) body.confirmedResult = output;
      const response = await fetch("/api/ai/infer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = (await response.json()) as InferenceResponse;
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "تعذر تشغيل خدمة الـ AI.");
      const result = payload.result ?? null;
      setOutput(result);
      setValidation(isValid(payload));
      setRouted(payload.routed === true);
      setExecuted(payload.executed === true);
      setRequiresConfirmation(payload.requiresConfirmation === true);
      setStatus(payload.executed === true ? "تم التحقق من التنفيذ وحفظه" : payload.requiresConfirmation === true ? "في انتظار تأكيدك" : payload.routed === true ? "تم التوجيه بدون تنفيذ" : "تمت المصادقة على الناتج");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء الاتصال بالخدمة.");
      setStatus("فشل"); setExecuted(false);
    } finally { setLoading(false); setConfirming(false); }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || confirming) return;
    await requestInference(false);
  }

  const showConfirm = requiresConfirmation && !executed && output !== null && isMutation(output);

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/30 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="جرب: سجلي 100 جنيه منظفات" dir="rtl" className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-[#0a0a0a] px-5 text-base text-white outline-none placeholder:text-white/30 transition focus:border-white/30 focus:ring-2 focus:ring-white/10" aria-label="طلب Smart AI" />
          <button type="submit" disabled={loading || confirming || !input.trim()} className="min-h-14 rounded-2xl bg-white px-7 font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40">{loading ? "جاري التحويل..." : "حول لـ JSON"}</button>
        </div>
      </form>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/45">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">POST /api/ai/infer</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">JSON-Only</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">{status}</span>
      </div>
      {error && <div role="alert" className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm leading-7 text-red-200">{error}</div>}
      {output !== null && !error && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#070707]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-bold text-white">النتيجة</p><p className="mt-1 text-xs text-white/35">Structured JSON response</p></div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className={`rounded-full border px-3 py-1.5 ${validation ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>{validation ? "Validation ✓" : "Validation ✗"}</span>
              <span className={`rounded-full border px-3 py-1.5 ${routed ? "border-sky-400/20 bg-sky-400/10 text-sky-300" : "border-white/10 text-white/40"}`}>{routed ? "Routed ✓" : "Routed —"}</span>
              <span className={`rounded-full border px-3 py-1.5 ${executed ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/40"}`}>{executed ? "Executed ✓" : "Executed —"}</span>
            </div>
          </div>
          <pre dir="ltr" className="max-h-[520px] overflow-auto p-5 text-left text-xs leading-7 text-white/80 sm:text-sm">{formatJson(output)}</pre>
          {showConfirm && (
            <div className="border-t border-amber-400/20 bg-amber-400/[0.05] p-5">
              <p className="text-sm font-bold text-amber-200">العملية هتغيّر بياناتك.</p>
              <p className="mt-1 text-xs leading-6 text-amber-100/60">لا يتم التنفيذ إلا بعد تأكيد صريح.</p>
              <button type="button" disabled={confirming} onClick={() => void requestInference(true)} className="mt-4 rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-black disabled:opacity-50">{confirming ? "جاري التحقق والتنفيذ..." : "أؤكد التنفيذ"}</button>
            </div>
          )}
        </div>
      )}
      <div className="mt-7 border-t border-white/10 pt-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Service pipeline</p>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          {["Qwen3-4B V2 (r=64)", "JSON", "Validation", "Tool Router", "DB"].map((step, index, steps) => (
            <span key={step} className="flex items-center gap-2"><span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/70">{step}</span>{index < steps.length - 1 && <span className="text-white/25" aria-hidden="true">→</span>}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
