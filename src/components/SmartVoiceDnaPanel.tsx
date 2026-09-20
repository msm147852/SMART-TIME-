import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, ShieldCheck, Trash2, X } from "lucide-react";
import type { Language, SmartVoiceDnaRelationship, SmartVoiceDnaSpeakingStyle } from "../types";
import {
  createVoiceDnaId,
  deleteVoiceDnaProfile,
  listVoiceDnaProfiles,
  saveVoiceDnaProfile,
  saveVoiceDnaSample,
  setDefaultVoiceDnaProfile,
  clearDefaultVoiceDnaProfile,
  type SmartVoiceDnaProfile,
} from "../services/smartVoiceDnaService";

interface Props {
  language: Language;
  onClose: () => void;
}

type RecordState = "idle" | "recording" | "saving";

const labels: Record<SmartVoiceDnaRelationship, { ar: string; en: string }> = {
  self: { ar: "أنا", en: "Me" },
  father: { ar: "أبي", en: "Father" },
  mother: { ar: "أمي", en: "Mother" },
  spouse: { ar: "الزوج/الزوجة", en: "Spouse" },
  son: { ar: "ابني", en: "Son" },
  daughter: { ar: "ابنتي", en: "Daughter" },
  family: { ar: "فرد من العائلة", en: "Family member" },
};

const CONSENT_PHRASE_AR = "أنا صاحب الصوت، وأوافق على إنشاء ملف صوتي خاص بي داخل SMART TIME.";
const CONSENT_PHRASE_EN = "I am the voice owner, and I consent to creating my private SMART TIME voice profile.";

export const SmartVoiceDnaPanel: React.FC<Props> = ({ language, onClose }) => {
  const [profiles, setProfiles] = useState<SmartVoiceDnaProfile[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [relationship, setRelationship] = useState<SmartVoiceDnaRelationship>("self");
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const [speakingStyle, setSpeakingStyle] = useState<SmartVoiceDnaSpeakingStyle>("natural");
  const [isDefault, setIsDefault] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [message, setMessage] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  const ar = language === "ar";
  const requiresGuardian = relationship === "son" || relationship === "daughter";

  useEffect(() => {
    void refreshProfiles();
    return () => stopActiveRecorder();
  }, []);

  const refreshProfiles = async () => {
    try {
      setProfiles(await listVoiceDnaProfiles());
    } catch {
      setMessage(ar ? "تعذر فتح تخزين Voice DNA المحلي." : "Could not open local Voice DNA storage.");
    }
  };

  const stopActiveRecorder = () => {
    try {
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    } catch {
      // no-op
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
  };

  const startRecording = async () => {
    setMessage("");
    if (!displayName.trim()) {
      setMessage(ar ? "اكتب اسمًا لملف الصوت أولًا." : "Enter a name for the voice profile first.");
      return;
    }
    if (!ownerConfirmed) {
      setMessage(ar ? "لازم صاحب الصوت يوافق بنفسه قبل التسجيل." : "The voice owner must consent before recording.");
      return;
    }
    if (requiresGuardian && !guardianConfirmed) {
      setMessage(ar ? "صوت الطفل يحتاج موافقة ولي الأمر." : "A child voice requires guardian consent.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage(ar ? "تسجيل الصوت غير مدعوم على هذا المتصفح." : "Audio recording is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      startedAtRef.current = performance.now();
      setElapsedMs(0);
      setRecordState("recording");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const durationMs = Math.max(0, Math.round(performance.now() - startedAtRef.current));
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
        if (durationMs < 3000) {
          setRecordState("idle");
          setMessage(ar ? "التسجيل قصير جدًا. خليه 3 ثواني أو أكثر." : "The recording is too short. Record at least 3 seconds.");
          return;
        }

        setRecordState("saving");
        try {
          const profileId = createVoiceDnaId();
          const now = new Date().toISOString();
          const profile: SmartVoiceDnaProfile = {
            id: profileId,
            displayName: displayName.trim(),
            relationship,
            language: ar ? "ar" : "en",
            locale: ar ? "ar-EG" : "en-US",
            dialect: ar ? "ar-EG" : "en-US",
            speakingStyle,
            isDefault,
            consentMode: requiresGuardian ? "guardian" : "self",
            ownerConfirmed,
            guardianConfirmed: requiresGuardian ? guardianConfirmed : false,
            consentRecordedAt: now,
            createdAt: now,
            sampleDurationMs: durationMs,
            engineStatus: "pending_local_engine",
          };

          await saveVoiceDnaProfile(profile);
          await saveVoiceDnaSample(profileId, new Blob(chunksRef.current, { type: mimeType }), durationMs);
          if (isDefault) await setDefaultVoiceDnaProfile(profileId);
          await refreshProfiles();
          setRecordState("idle");
          setMessage(ar
            ? "تم حفظ ملف Voice DNA محليًا ومشفّرًا. لم يتم رفع الصوت إلى أي خدمة."
            : "Voice DNA was saved locally and encrypted. The recording was not uploaded to a service.");
          setDisplayName("");
          setOwnerConfirmed(false);
          setGuardianConfirmed(false);
          setSpeakingStyle("natural");
          setIsDefault(false);
        } catch (error) {
          console.error("Voice DNA save failed:", error);
          setRecordState("idle");
          setMessage(ar ? "تعذر حفظ ملف الصوت محليًا." : "Could not save the local voice profile.");
        }
      };

      recorder.start(250);
      const timer = window.setInterval(() => {
        const nextMs = Math.round(performance.now() - startedAtRef.current);
        setElapsedMs(nextMs);
        if (nextMs >= 30000 && recorder.state === "recording") recorder.stop();
      }, 250);

      recorder.addEventListener("stop", () => window.clearInterval(timer), { once: true });
    } catch (error) {
      console.error("Voice DNA microphone error:", error);
      stopActiveRecorder();
      setRecordState("idle");
      setMessage(ar ? "لم نقدر نفتح الميكروفون. راجع إذن الميكروفون في المتصفح." : "Microphone access failed. Check the browser microphone permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVoiceDnaProfile(id);
      await refreshProfiles();
      setMessage(ar ? "تم حذف ملف Voice DNA وعينته المحلية." : "Voice DNA profile and local sample deleted.");
    } catch {
      setMessage(ar ? "تعذر حذف الملف." : "Could not delete the profile.");
    }
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl border border-purple-900/40 shadow-xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-extrabold">
            <ShieldCheck className="w-5 h-5 text-purple-300" />
            <span>SMART VOICE DNA</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            {ar
              ? "اصنع ملفًا صوتيًا بإذن صاحبه. في V1 التسجيل يظل محليًا ومشفّرًا، ومحرك الاستنساخ المحلي سيتم ربطه لاحقًا."
              : "Create a voice profile with the owner's consent. In V1 the recording stays local and encrypted; the local cloning engine will be connected later."}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/10" title="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-3 mt-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
          <label className="block text-[11px] font-bold text-slate-300 mb-1">{ar ? "اسم الملف" : "Profile name"}</label>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-xs outline-none" placeholder={ar ? "مثال: صوتي / بابا / ماما" : "Example: Me / Dad / Mom"} />

          <label className="block text-[11px] font-bold text-slate-300 mt-3 mb-1">{ar ? "صلة القرابة" : "Relationship"}</label>
          <select value={relationship} onChange={(event) => {
            const next = event.target.value as SmartVoiceDnaRelationship;
            setRelationship(next);
            if (next !== "son" && next !== "daughter") setGuardianConfirmed(false);
          }} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-xs outline-none">
            {Object.entries(labels).map(([id, label]) => (
              <option key={id} value={id}>{ar ? label.ar : label.en}</option>
            ))}
          </select>

          <label className="flex items-start gap-2 mt-3 text-[11px] text-slate-300 leading-relaxed">
            <input type="checkbox" checked={ownerConfirmed} onChange={(event) => setOwnerConfirmed(event.target.checked)} className="mt-0.5" />
            <span>{ar ? "أنا صاحب الصوت وقد وافقت بنفسي على إنشاء هذا الملف." : "I am the voice owner and I personally consent to this profile."}</span>
          </label>

          {requiresGuardian && (
            <label className="flex items-start gap-2 mt-2 text-[11px] text-slate-300 leading-relaxed">
              <input type="checkbox" checked={guardianConfirmed} onChange={(event) => setGuardianConfirmed(event.target.checked)} className="mt-0.5" />
              <span>{ar ? "أنا ولي الأمر وأوافق على إنشاء ملف صوت الطفل." : "I am the guardian and consent to the child's voice profile."}</span>
            </label>
          )}

          <label className="block text-[11px] font-bold text-slate-300 mt-3 mb-1">{ar ? "أسلوب الكلام" : "Speaking style"}</label>
          <select value={speakingStyle} onChange={(event) => setSpeakingStyle(event.target.value as SmartVoiceDnaSpeakingStyle)} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-xs outline-none">
            <option value="natural">{ar ? "طبيعي" : "Natural"}</option>
            <option value="calm">{ar ? "هادئ" : "Calm"}</option>
            <option value="warm">{ar ? "دافئ" : "Warm"}</option>
            <option value="formal">{ar ? "رسمي" : "Formal"}</option>
            <option value="alert">{ar ? "تنبيه" : "Alert"}</option>
          </select>
          <label className="flex items-center gap-2 mt-3 text-[11px] text-slate-300">
            <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
            <span>{ar ? "استخدم هذا الصوت تلقائيًا مع SMART AI" : "Use this voice by default with SMART AI"}</span>
          </label>

          <div className="mt-3 rounded-xl bg-purple-500/10 border border-purple-400/20 p-2.5 text-[10px] leading-relaxed text-purple-100">
            <div className="font-bold mb-1">{ar ? "جملة الموافقة للتسجيل" : "Consent phrase"}</div>
            <div>{ar ? CONSENT_PHRASE_AR : CONSENT_PHRASE_EN}</div>
          </div>

          <button type="button" disabled={recordState === "saving"} onClick={recordState === "recording" ? stopRecording : () => void startRecording()} className="mt-3 w-full rounded-xl px-3 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 flex items-center justify-center gap-2 text-xs font-extrabold">
            {recordState === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            {recordState === "recording"
              ? (ar ? "إيقاف التسجيل" : "Stop recording") + " · " + (elapsedMs / 1000).toFixed(1) + "s"
              : recordState === "saving"
                ? (ar ? "جارٍ الحفظ..." : "Saving...")
                : (ar ? "تسجيل Voice DNA" : "Record Voice DNA")}
          </button>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-extrabold">{ar ? "ملفاتك الصوتية" : "Your voice profiles"}</div>
            <div className="text-[10px] text-slate-400">{profiles.length}</div>
          </div>
          <div className="space-y-2 mt-3 max-h-72 overflow-y-auto">
            {profiles.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[11px] text-slate-400">
                {ar ? "لسه مفيش ملفات صوتية." : "No voice profiles yet."}
              </div>
            )}
            {profiles.map((profile) => (
              <div key={profile.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{profile.displayName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {ar ? labels[profile.relationship].ar : labels[profile.relationship].en} · {(profile.sampleDurationMs / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <button type="button" onClick={() => void handleDelete(profile.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-400/10" title={ar ? "حذف" : "Delete"}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  <span>{ar ? "محلي ومشفّر" : "Local and encrypted"}</span>
                </div>
                <div className="text-[10px] text-purple-200/90 mt-1">{profile.speakingStyle ? (ar ? `الأسلوب: ${profile.speakingStyle}` : `Style: ${profile.speakingStyle}`) : ""}</div>
                <div className="text-[10px] text-amber-200/90 mt-1">
                  {ar ? "المحرك الصوتي المحلي: غير موصول بعد" : "Local voice engine: not connected yet"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-200">{message}</div>}
    </div>
  );
};
