import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { id: number; role: "user" | "assistant"; text: string };
type ApiPayload = { result?: { tool?: string }; error?: string };
const APP_FEATURE_TOOLS = new Set(["add_expense", "add_daily_task", "calendar.event.create"]);

function assistantText(result: ApiPayload["result"]) {
  if (result?.tool && APP_FEATURE_TOOLS.has(result.tool)) return "الميزة دي في التطبيق - حمله من هنا";
  if (result?.tool === "clarification") return "ممكن توضّحلي طلبك أكتر؟";
  if (result?.tool === "unsupported") return "الطلب ده متاح داخل تطبيق SMART TIME الكامل.";
  return "أهلاً بيك! أنا مساعد SMART TIME. أقدر أساعدك في فهم طلبك، والميزات الكاملة موجودة داخل التطبيق.";
}
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-EG"; utterance.rate = 0.95; window.speechSynthesis.speak(utterance);
}

export default function SmartAIDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 1, role: "assistant", text: "أهلاً بيك 👋 أنا مساعد SMART TIME. اسألني أو اتكلم معايا بالعربي." }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false); const [listening, setListening] = useState(false); const [error, setError] = useState("");
  const nextId = useRef(2); const recognitionRef = useRef<any>(null);

  useEffect(() => { document.title = "SMART TIME"; return () => { window.speechSynthesis?.cancel(); recognitionRef.current?.stop?.(); }; }, []);

  function toggleMic() {
    if (listening) { recognitionRef.current?.stop?.(); setListening(false); return; }
    const Recognition = (window as any).webkitSpeechRecognition;
    if (!Recognition) { setError("المتصفح الحالي لا يدعم التعرف على الصوت."); return; }
    const recognition = new Recognition();
    recognition.lang = "ar-EG"; recognition.continuous = false; recognition.interimResults = false;
    recognition.onstart = () => { setListening(true); setError(""); };
    recognition.onresult = (event: any) => setInput(String(event.results?.[0]?.[0]?.transcript || ""));
    recognition.onerror = () => { setListening(false); setError("حصلت مشكلة في الميكروفون. جرّب تاني."); };
    recognition.onend = () => setListening(false); recognitionRef.current = recognition; recognition.start();
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault(); const text = input.trim(); if (!text || loading) return;
    setMessages((current) => [...current, { id: nextId.current++, role: "user", text }]); setInput(""); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/ai/infer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: text }) });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok) throw new Error(payload.error || "تعذر الاتصال بالمساعد.");
      const reply = assistantText(payload.result);
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: reply }]); speak(reply);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "حصل خطأ غير متوقع."); }
    finally { setLoading(false); }
  }

  return <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30">
    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4 sm:px-5"><div><p className="text-sm font-bold">مساعد SMART TIME</p><p className="mt-1 text-xs text-zinc-500">Qwen3-4B V2 · r=64 · enable_thinking=false</p></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" title="متصل" /></div>
    <div className="flex min-h-[390px] flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">{messages.map((message) => <div key={message.id} className={message.role === "user" ? "flex justify-start" : "flex justify-end"}><div className={message.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-7 text-black" : "max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-7 text-zinc-100"}>{message.text}</div></div>)}{loading && <div className="flex justify-end"><div className="rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-500">بفكر…</div></div>}</div>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      <form onSubmit={sendMessage} className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-2">
        <button type="button" onClick={toggleMic} aria-label={listening ? "إيقاف الميكروفون" : "تشغيل الميكروفون"} className={listening ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white"} title={listening ? "إيقاف التسجيل" : "تحدث"}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" strokeLinecap="round" /></svg></button>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={listening ? "بتسمعك…" : "اكتب رسالتك…"} dir="rtl" className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-zinc-600" aria-label="رسالتك" />
        <button type="submit" disabled={loading || !input.trim()} aria-label="إرسال" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      </form>
    </div>
  </section>;
}
