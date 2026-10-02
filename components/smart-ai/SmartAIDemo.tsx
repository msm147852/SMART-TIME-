import { FormEvent, useEffect, useRef, useState } from "react";
import { SmartAiVoiceConversationModal } from "../../src/components/SmartAiVoiceConversationModal";

type ChatMessage = { id: number; role: "user" | "assistant"; text: string };
type ApiPayload = {
  result?: { tool?: string; reply?: string };
  error?: string;
  degraded?: boolean;
};
const APP_FEATURE_TOOLS = new Set(["add_expense", "add_daily_task", "calendar.event.create"]);

function assistantText(result: ApiPayload["result"]) {
  if (result?.reply?.trim()) return result.reply.trim();
  if (result?.tool && APP_FEATURE_TOOLS.has(result.tool)) return "الميزة دي في التطبيق - حمله من هنا";
  if (result?.tool === "clarification") return "ممكن توضّحلي طلبك أكتر؟";
  if (result?.tool === "unsupported") return "الطلب ده متاح داخل تطبيق SMART TIME الكامل.";
  return "أهلاً بيك! أنا مساعد SMART TIME. أقدر أساعدك في فهم طلبك، والميزات الكاملة موجودة داخل التطبيق.";
}

async function speak(text: string): Promise<void> {
  if (typeof window === "undefined" || !text.trim()) return;

  // SMART AI must not silently downgrade to a random browser Arabic voice.
  // The conversation contract requires Egyptian Arabic from the server-side
  // VoiceTuT provider. Browser TTS remains an explicit non-Egyptian fallback
  // only when the user later chooses a generic voice mode.
  const response = await fetch("/api/ai/egyptian-tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.trim(), speaker: "Mohamed" }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "محرك الصوت المصري غير متاح حاليًا.");
  }

  const blob = await response.blob();
  if (!blob.size) throw new Error("محرك الصوت المصري أعاد ملفًا صوتيًا فارغًا.");

  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("تعذر تشغيل الرد الصوتي المصري."));
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  // Stop any HTMLAudioElement used by the server-generated Egyptian reply.
  document.querySelectorAll("audio").forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
  });
}

export default function SmartAIDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: "أهلاً بيك 👋 أنا مساعد SMART TIME. اسألني أو اتكلم معايا بالعربي." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voiceConversationOpen, setVoiceConversationOpen] = useState(false);
  const nextId = useRef(2);

  useEffect(() => {
    document.title = "SMART TIME";
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  async function sendMessage(event?: FormEvent, textOverride?: string) {
    event?.preventDefault();

    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", text },
    ]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/infer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok) {
        throw new Error(payload.error || "تعذر الاتصال بالمساعد.");
      }

      const reply = assistantText(payload.result);
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: "assistant", text: reply },
      ]);
      await speak(reply);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "حصل خطأ غير متوقع.";
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4 sm:px-5">
        <div>
          <p className="text-sm font-bold">مساعد SMART TIME</p>
          <p className="mt-1 text-xs text-zinc-500">
            Qwen3-4B V2 · r=64 · enable_thinking=false
          </p>
        </div>
        <span
          className="h-2.5 w-2.5 rounded-full bg-emerald-400"
          title="متصل"
        />
      </div>

      <div className="flex min-h-[390px] flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "flex justify-start"
                  : "flex justify-end"
              }
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-7 text-black"
                    : "max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-7 text-zinc-100"
                }
              >
                {message.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-500">
                بفكر…
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-300">
            {error}
          </p>
        )}

        <SmartAiVoiceConversationModal
          isOpen={voiceConversationOpen}
          language="ar"
          onClose={() => {
            stopSpeech();
            setVoiceConversationOpen(false);
          }}
          onInterrupt={stopSpeech}
          onTurn={async (transcript) => {
            await sendMessage(undefined, transcript);
          }}
        />

        <form
          onSubmit={(event) => {
            void sendMessage(event);
          }}
          className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-2"
        >
          <button
            type="button"
            onClick={() => setVoiceConversationOpen(true)}
            aria-label="بدء محادثة SMART AI الصوتية"
            title="محادثة SMART AI الصوتية"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-900/30 transition-all hover:bg-indigo-600 active:scale-95"
          >
            <span className="absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <rect x="8" y="3" width="8" height="12" rx="4" />
              <path
                d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="اكتب رسالتك… أو اضغط زر المحادثة الصوتية"
            dir="rtl"
            className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
            aria-label="رسالتك"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="إرسال"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path
                d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
