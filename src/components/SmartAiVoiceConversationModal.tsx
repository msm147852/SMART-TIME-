import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Sparkles, X } from 'lucide-react';
import { Language } from '../types';
import { transcribeVoiceBlob } from '../services/groqSttService';

type VoiceStatus = 'starting' | 'listening' | 'processing' | 'error';

const RECORDING_MAX_MS = 90_000;
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
];

function isLikelyDuplicate(previous: string, next: string) {
  const a = previous.replace(/\s+/g, ' ').trim().toLowerCase();
  const b = next.replace(/\s+/g, ' ').trim().toLowerCase();
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

interface Props {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onTurn: (transcript: string) => Promise<void>;
  onInterrupt?: () => void;
}

export const SmartAiVoiceConversationModal: React.FC<Props> = ({
  isOpen,
  language,
  onClose,
  onTurn,
  onInterrupt,
}) => {
  const [status, setStatus] = useState<VoiceStatus>('starting');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const turnGenerationRef = useRef(0);
  const lastTranscriptRef = useRef('');
  const onTurnRef = useRef(onTurn);
  const onInterruptRef = useRef(onInterrupt);

  useEffect(() => {
    onTurnRef.current = onTurn;
    onInterruptRef.current = onInterrupt;
  }, [onTurn, onInterrupt]);

  const clearTimer = () => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const resetRecorder = () => {
    clearTimer();
    recorderRef.current = null;
    chunksRef.current = [];
    releaseStream();
  };

  const fail = (message: string) => {
    processingRef.current = false;
    setStatus('error');
    setError(message);
  };

  const processTurn = async (blob: Blob, generation: number) => {
    try {
      const result = await transcribeVoiceBlob(blob, language === 'ar' ? 'ar' : 'en');
      if (!activeRef.current || generation !== turnGenerationRef.current) return;

      const text = result.transcript.trim();
      if (!text || isLikelyDuplicate(lastTranscriptRef.current, text)) {
        processingRef.current = false;
        setStatus('listening');
        return;
      }

      lastTranscriptRef.current = text;
      setTranscript(text);
      await onTurnRef.current(text);

      if (!activeRef.current || generation !== turnGenerationRef.current) return;
      processingRef.current = false;
      setTranscript('');
      setError(null);
      startRecording();
    } catch (cause) {
      if (!activeRef.current || generation !== turnGenerationRef.current) return;
      const code = cause instanceof Error ? String((cause as Error & { code?: string }).code || '') : '';
      const message = cause instanceof Error ? cause.message : 'Speech transcription failed.';
      processingRef.current = false;
      setStatus('error');
      setError(
        code === 'authentication-required'
          ? (language === 'ar' ? 'لازم يكون فيه جلسة دخول فعالة للمحادثة الصوتية.' : 'An authenticated session is required for voice conversation.')
          : code === 'rate-limit'
            ? (language === 'ar' ? 'طلبات الصوت زادت مؤقتًا. جرّب بعد شوية.' : 'Voice rate limit reached. Try again shortly.')
            : language === 'ar' ? message : 'Voice transcription or reply failed.',
      );
    }
  };

  const stopRecording = () => {
    clearTimer();
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    processingRef.current = true;
    setStatus('processing');
    recorder.stop();
  };

  const startRecording = async () => {
    if (!activeRef.current || processingRef.current) return;

    setStatus('starting');
    setError(null);
    setTranscript('');
    chunksRef.current = [];

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      fail(language === 'ar'
        ? 'تسجيل الصوت الحقيقي غير مدعوم في هذا المتصفح.'
        : 'Real audio recording is not supported in this browser.');
      return;
    }

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
      const name = cause instanceof DOMException ? cause.name : 'UnknownError';
      fail(name === 'NotAllowedError'
        ? (language === 'ar' ? 'تم رفض إذن الميكروفون.' : 'Microphone permission was denied.')
        : (language === 'ar' ? 'تعذر الوصول إلى الميكروفون.' : 'Microphone capture failed.'));
      return;
    }

    if (!activeRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;
    const mimeType = SUPPORTED_MIME_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 })
        : new MediaRecorder(stream);
    } catch {
      releaseStream();
      fail(language === 'ar' ? 'تعذر بدء تسجيل الصوت.' : 'Could not start audio recording.');
      return;
    }

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      resetRecorder();
      fail(language === 'ar' ? 'حدث خطأ أثناء تسجيل الصوت.' : 'An error occurred while recording audio.');
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' });
      resetRecorder();
      const generation = turnGenerationRef.current;
      if (!blob.size) {
        fail(language === 'ar' ? 'لم يتم التقاط صوت.' : 'No audio was captured.');
        return;
      }
      await processTurn(blob, generation);
    };

    recorderRef.current = recorder;
    try {
      recorder.start();
      setStatus('listening');
      stopTimerRef.current = window.setTimeout(stopRecording, RECORDING_MAX_MS);
    } catch {
      resetRecorder();
      fail(language === 'ar' ? 'تعذر بدء تسجيل الصوت.' : 'Could not start audio recording.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    activeRef.current = true;
    processingRef.current = false;
    turnGenerationRef.current += 1;
    lastTranscriptRef.current = '';
    setTranscript('');
    setError(null);
    setStatus('starting');
    void startRecording();

    return () => {
      activeRef.current = false;
      processingRef.current = false;
      turnGenerationRef.current += 1;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch {}
      }
      resetRecorder();
    };
  }, [isOpen, language]);

  const stopConversation = () => {
    activeRef.current = false;
    processingRef.current = false;
    turnGenerationRef.current += 1;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch {}
    }
    resetRecorder();
    onInterruptRef.current?.();
    onClose();
  };

  const interruptAi = () => {
    if (!activeRef.current || !processingRef.current) return;
    turnGenerationRef.current += 1;
    processingRef.current = false;
    clearTimer();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch {}
    }
    resetRecorder();
    onInterruptRef.current?.();
    setError(null);
    setTranscript('');
    void startRecording();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-850 rounded-[32px] border border-purple-200 dark:border-purple-900 shadow-2xl max-w-md w-full p-7 text-center space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-extrabold">
            <Sparkles className="w-5 h-5" />
            <span>{language === 'ar' ? 'محادثة SMART AI الصوتية' : 'SMART AI Voice Conversation'}</span>
          </div>
          <button type="button" onClick={stopConversation} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex items-center justify-center py-4">
          <div className={
            'w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all ' +
            (status === 'listening'
              ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-fuchsia-500 animate-pulse scale-110'
              : status === 'processing'
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                : status === 'error'
                  ? 'bg-red-500'
                  : 'bg-slate-500')
          }>
            {status === 'processing'
              ? <Loader2 className="w-11 h-11 animate-spin" />
              : status === 'listening'
                ? <Mic className="w-11 h-11" />
                : status === 'starting'
                  ? <Loader2 className="w-11 h-11 animate-spin" />
                  : <MicOff className="w-11 h-11" />}
          </div>
          {status === 'listening' && <div className="absolute w-36 h-36 rounded-full border-4 border-purple-400/30 animate-ping" />}
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {status === 'listening'
              ? (language === 'ar' ? 'أنا سامعك… اضغط إيقاف لما تخلص' : 'I’m listening… stop when you finish')
              : status === 'processing'
                ? (language === 'ar' ? 'سمعتك… بفهم وبجهز الرد' : 'I heard you… preparing a reply')
                : status === 'starting'
                  ? (language === 'ar' ? 'جاهز…' : 'Ready…')
                  : (language === 'ar' ? 'المحادثة الصوتية متوقفة' : 'Voice conversation paused')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar'
              ? 'كل دور بيتسجل ويتحوّل عبر Groq Whisper، والميكروفون لا يفتح أثناء رد SMART AI.'
              : 'Each turn is recorded and transcribed by Groq Whisper; the microphone stays closed while SMART AI replies.'}
          </p>
        </div>

        <div className="min-h-[84px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-arabic font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center">
          <span>{transcript || (language === 'ar' ? 'في انتظار كلامك…' : 'Waiting for you…')}</span>
        </div>

        {error && <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 text-xs font-bold">{error}</div>}

        {status === 'listening' && (
          <button type="button" onClick={stopRecording} className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm flex items-center justify-center gap-2">
            <MicOff className="w-4 h-4" />
            {language === 'ar' ? 'إيقاف الدور وإرساله' : 'Stop turn and send'}
          </button>
        )}

        {status === 'processing' && (
          <button type="button" onClick={interruptAi} className="w-full py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm flex items-center justify-center gap-2">
            <Mic className="w-4 h-4" />
            {language === 'ar' ? 'قاطع الرد واتكلم' : 'Interrupt and speak'}
          </button>
        )}

        <button type="button" onClick={stopConversation} className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2">
          <MicOff className="w-4 h-4" />
          {language === 'ar' ? 'إنهاء المحادثة' : 'End conversation'}
        </button>
      </div>
    </div>
  );
};
