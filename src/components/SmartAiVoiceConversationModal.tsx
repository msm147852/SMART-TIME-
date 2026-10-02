import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Sparkles, X } from 'lucide-react';
import { Language } from '../types';

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence?: number } }>;
  }) => void) | null;
  onspeechend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

const getRecognition = (): RecognitionCtor | null => {
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

const normalizeTranscript = (value: string) =>
  value
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const isLikelyDuplicate = (previous: string, next: string) => {
  const a = normalizeTranscript(previous);
  const b = normalizeTranscript(next);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

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
  const [status, setStatus] = useState<'starting' | 'listening' | 'processing' | 'error'>('starting');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const finalTranscriptRef = useRef('');
  const lastFinalCandidateRef = useRef('');
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTurnRef = useRef(onTurn);
  const onInterruptRef = useRef(onInterrupt);

  useEffect(() => {
    onTurnRef.current = onTurn;
    onInterruptRef.current = onInterrupt;
  }, [onTurn, onInterrupt]);

  useEffect(() => {
    if (!isOpen) return;

    const Ctor = getRecognition();
    if (!Ctor) {
      setStatus('error');
      setError(language === 'ar'
        ? 'التحدث الصوتي غير مدعوم في هذا المتصفح.'
        : 'Voice conversation is not supported in this browser.');
      return;
    }

    activeRef.current = true;
    processingRef.current = false;
    finalTranscriptRef.current = '';
    lastFinalCandidateRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setStatus('starting');

    const recognition = new Ctor();

    // One recognition session = one user turn.
    // This is intentional: Android Chrome has known duplication/continuous-mode
    // inconsistencies, so the conversation itself is continuous while each turn
    // is isolated and committed exactly once.
    recognition.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const clearSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    const startListening = () => {
      if (!activeRef.current || processingRef.current) return;
      clearSilenceTimer();
      finalTranscriptRef.current = '';
      lastFinalCandidateRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      setStatus('starting');
      try {
        recognition.start();
      } catch {
        // Browser can reject a duplicate start while the previous session closes.
      }
    };

    recognition.onstart = () => {
      if (!activeRef.current || processingRef.current) return;
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event) => {
      let latestInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const candidate = String(result[0]?.transcript || '').trim();
        if (!candidate) continue;

        if (result.isFinal) {
          // Mobile recognizers can emit the same final phrase more than once.
          // Keep one best candidate for this turn instead of concatenating echoes.
          if (!isLikelyDuplicate(lastFinalCandidateRef.current, candidate)) {
            if (
              !finalTranscriptRef.current ||
              candidate.length >= finalTranscriptRef.current.length
            ) {
              finalTranscriptRef.current = candidate;
              lastFinalCandidateRef.current = candidate;
            }
          }
          setTranscript(finalTranscriptRef.current);
          setInterimTranscript('');
        } else {
          latestInterim = candidate;
        }
      }

      if (latestInterim) setInterimTranscript(latestInterim);
    };

    recognition.onspeechend = () => {
      if (!activeRef.current || processingRef.current) return;
      clearSilenceTimer();

      // Give the recognizer a short settling window so the last Arabic words
      // can become final before the session is stopped.
      silenceTimerRef.current = setTimeout(() => {
        if (activeRef.current && !processingRef.current) recognition.stop();
      }, 650);
    };

    recognition.onerror = (event) => {
      const code = event.error || 'unknown';
      clearSilenceTimer();
      if (!activeRef.current || code === 'aborted' || code === 'no-speech') return;

      processingRef.current = false;
      setStatus('error');
      setError(language === 'ar'
        ? `حصلت مشكلة في الميكروفون: ${code}`
        : `Microphone/recognition error: ${code}`);
    };

    recognition.onend = async () => {
      clearSilenceTimer();
      setInterimTranscript('');
      if (!activeRef.current || processingRef.current) return;

      const text = finalTranscriptRef.current.trim();
      if (!text) {
        startListening();
        return;
      }

      processingRef.current = true;
      setStatus('processing');

      try {
        // IMPORTANT: onTurn resolves only after the AI response has finished
        // speaking. We do not reopen the microphone while SMART AI is talking.
        await onTurnRef.current(text);

        finalTranscriptRef.current = '';
        lastFinalCandidateRef.current = '';
        setTranscript('');
        processingRef.current = false;
        if (activeRef.current) startListening();
      } catch {
        processingRef.current = false;
        if (activeRef.current) {
          setStatus('error');
          setError(language === 'ar'
            ? 'SMART AI استقبل كلامك، لكن الرد الصوتي فشل. المحادثة متوقفة لحد ما تبدأ الدور التالي.'
            : 'SMART AI received your turn, but the voice reply failed. The conversation is paused.');
        }
      }
    };

    recognitionRef.current = recognition;
    startListening();

    return () => {
      activeRef.current = false;
      processingRef.current = false;
      clearSilenceTimer();
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [isOpen, language]);

  const stopConversation = () => {
    activeRef.current = false;
    processingRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.abort();
    onInterruptRef.current?.();
    onClose();
  };

  const interruptAi = () => {
    if (!activeRef.current || !processingRef.current) return;
    processingRef.current = false;
    onInterruptRef.current?.();
    setStatus('starting');
    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    // The current recognition session has already ended; startListening is
    // reached by the next effect cycle after the AI interruption.
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.start();
      } catch {
        // If the browser still considers it active, its existing session wins.
      }
    }
  };

  if (!isOpen) return null;

  const displayedTranscript = [transcript, interimTranscript].filter(Boolean).join(' ');

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
          {status === 'listening' && (
            <div className="absolute w-36 h-36 rounded-full border-4 border-purple-400/30 animate-ping" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {status === 'listening'
              ? (language === 'ar' ? 'أنا سامعك… خد وقتك' : 'I’m listening… take your time')
              : status === 'processing'
                ? (language === 'ar' ? 'سمعتك… بفهم وبجهز الرد' : 'I heard you… preparing a reply')
                : status === 'starting'
                  ? (language === 'ar' ? 'جاهز… اتكلم لما تسمعني' : 'Ready… speak when you are')
                  : (language === 'ar' ? 'المحادثة الصوتية متوقفة' : 'Voice conversation paused')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar'
              ? 'كل دور صوتي بيتقفل لوحده؛ SMART AI مش هيفتح الميكروفون وهو بيتكلم.'
              : 'Each turn is isolated; the microphone stays closed while SMART AI speaks.'}
          </p>
        </div>

        <div className="min-h-[84px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-arabic font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center">
          <span>{displayedTranscript || (language === 'ar' ? 'في انتظار كلامك…' : 'Waiting for you…')}</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 text-xs font-bold">
            {error}
          </div>
        )}

        {status === 'processing' && (
          <button
            type="button"
            onClick={interruptAi}
            className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4" />
            {language === 'ar' ? 'قاطع الرد واتكلم' : 'Interrupt and speak'}
          </button>
        )}

        <button
          type="button"
          onClick={stopConversation}
          className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          <MicOff className="w-4 h-4" />
          {language === 'ar' ? 'إنهاء المحادثة' : 'End conversation'}
        </button>
      </div>
    </div>
  );
};
