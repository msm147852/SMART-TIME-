import { FormEvent, useEffect, useRef, useState } from "react";
import { SmartAiVoiceConversationModal } from "../../src/components/SmartAiVoiceConversationModal";
import { transcribeVoiceBlob } from "../../src/services/groqSttService";
import { startTrialSession } from "../../src/services/authService";

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
  const [voiceSearchState, setVoiceSearchState] = useState<"idle" | "recording" | "processing">("idle");
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceStopTimerRef = useRef<number | null>(null);
  const nextId = useRef(2);

  useEffect(() => {
    document.title = "SMART TIME";
    void startTrialSession().catch(() => {
      // Keep the public demo usable; the voice path will surface an auth error if needed.
    });
    return () => {
      window.speechSynthesis?.cancel();
      if (voiceStopTimerRef.current !== null) {
        window.clearTimeout(voiceStopTimerRef.current);
      }
      try {
        const recorder = voiceRecorderRef.current;
        if (recorder && recorder.state !== "inactive") recorder.stop();
      } catch {}
      voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function resetVoiceSearch() {
    if (voiceStopTimerRef.current !== null) {
      window.clearTimeout(voiceStopTimerRef.current);
      voiceStopTimerRef.current = null;
    }
    voiceRecorderRef.current = null;
    voiceChunksRef.current = [];
    voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    voiceStreamRef.current = null;
  }

  async function startVoiceSearch() {
    if (loading || voiceSearchState !== "idle") return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("تسجيل الصوت الحقيقي غير مدعوم في هذا المتصفح.");
      return;
    }

    setError("");
    setVoiceSearchState("recording");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (cause) {
      setVoiceSearchState("idle");
      const name = cause instanceof DOMException ? cause.name : "UnknownError";
      setError(name === "NotAllowedError" ? "تم رفض إذن الميكروفون." : "تعذر الوصول إلى الميكروفون.");
      return;
    }

    voiceStreamRef.current = stream;
    const supportedTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
    ];
    const mimeType = supportedTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 })
        : new MediaRecorder(stream);
    } catch {
      resetVoiceSearch();
      setVoiceSearchState("idle");
      setError("تعذر بدء تسجيل الصوت.");
      return;
    }

    voiceRecorderRef.current = recorder;
    voiceChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) voiceChunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      resetVoiceSearch();
      setVoiceSearchState("idle");
      setError("حدث خطأ أثناء تسجيل الصوت.");
    };
    recorder.onstop = async () => {
      const blob = new Blob(voiceChunksRef.current, {
        type: recorder.mimeType || mimeType || "audio/webm",
      });
      resetVoiceSearch();

      if (!blob.size) {
        setVoiceSearchState("idle");
        setError("لم يتم التقاط صوت.");
        return;
      }

      setVoiceSearchState("processing");
      try {
        const result = await transcribeVoiceBlob(blob, "ar");
        const transcript = result.transcript.trim();
        if (!transcript) throw new Error("لم يتم التعرف على كلام واضح.");
        await sendMessage(undefined, transcript);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "تعذر تحويل الصوت إلى نص.");
      } finally {
        setVoiceSearchState("idle");
      }
    };

    try {
      recorder.start();
      voiceStopTimerRef.current = window.setTimeout(() => {
        if (voiceRecorderRef.current?.state === "recording") {
          voiceRecorderRef.current.stop();
        }
      }, 90_000);
    } catch {
      resetVoiceSearch();
      setVoiceSearchState("idle");
      setError("تعذر بدء تسجيل الصوت.");
    }
  }

  function handleVoiceSearchClick() {
    if (voiceSearchState === "recording") {
      if (voiceStopTimerRef.current !== null) {
        window.clearTimeout(voiceStopTimerRef.current);
        voiceStopTimerRef.current = null;
      }
      voiceRecorderRef.current?.stop();
      return;
    }
    void startVoiceSearch();
  }

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

        <form
          onSubmit={(event) => {
            void sendMessage(event);
          }}
          className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-2"
        >
          <button
            type="button"
            onClick={handleVoiceSearchClick}
            disabled={loading || voiceSearchState === "processing"}
            aria-label={voiceSearchState === "recording" ? "إيقاف التسجيل وإرسال الصوت للشات" : "إرسال صوت للشات"}
            title={voiceSearchState === "recording" ? "إيقاف التسجيل وإرسال الصوت للشات" : "إرسال صوت للشات"}
            className={
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 " +
              (voiceSearchState === "recording"
                ? "bg-red-600 shadow-red-900/30 hover:bg-red-700"
                : "bg-purple-600 shadow-purple-900/30 hover:bg-indigo-600")
            }
          >
            {voiceSearchState === "processing" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <>
                {voiceSearchState === "recording" && (
                  <span className="absolute -end-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-red-300 ring-2 ring-zinc-950" />
                )}
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
              </>
            )}
          </button>

          <SmartAiVoiceConversationModal
            inline
            isOpen={voiceConversationOpen}
            language="ar"
            onOpen={() => setVoiceConversationOpen(true)}
            onClose={() => {
              stopSpeech();
              setVoiceConversationOpen(false);
            }}
            onInterrupt={stopSpeech}
            onTurn={async (transcript) => {
              await sendMessage(undefined, transcript);
            }}
          />

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
