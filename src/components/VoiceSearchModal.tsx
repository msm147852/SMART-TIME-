import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../services/i18n';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onTranscript?: (transcript: string) => void;
}

type SpeechRecognitionLike = {
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
    results: ArrayLike<{
      isFinal: boolean;
      0: { transcript: string };
      length: number;
    }>;
  }) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  language,
  onTranscript,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    if (!isOpen) return;

    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setError(language === 'ar'
        ? 'التعرف الصوتي الحقيقي غير مدعوم في هذا المتصفح.'
        : 'Real speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsStarting(false);
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += text;
        else interim += text;
      }

      if (finalText.trim()) {
        const normalized = finalText.trim();
        const next = transcriptRef.current
          ? transcriptRef.current + ' ' + normalized
          : normalized;
        transcriptRef.current = next;
        setTranscript(next);
        onTranscriptRef.current?.(next);
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      setIsStarting(false);
      setIsListening(false);
      const code = event.error || 'unknown';
      const messages: Record<string, string> = {
        'not-allowed': language === 'ar' ? 'تم رفض إذن الميكروفون.' : 'Microphone permission was denied.',
        'service-not-allowed': language === 'ar' ? 'خدمة التعرف الصوتي غير مسموح بها.' : 'Speech recognition service is not allowed.',
        'no-speech': language === 'ar' ? 'لم يتم اكتشاف كلام.' : 'No speech was detected.',
        'audio-capture': language === 'ar' ? 'تعذر الوصول إلى الميكروفون.' : 'Microphone capture failed.',
        network: language === 'ar' ? 'تعذر الوصول إلى خدمة التعرف الصوتي.' : 'Speech recognition service is unavailable.',
      };
      setError(messages[code] || (language === 'ar' ? `فشل التعرف الصوتي: ${code}` : `Speech recognition failed: ${code}`));
    };

    recognition.onend = () => {
      setIsStarting(false);
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    setIsStarting(true);

    try {
      recognition.start();
    } catch {
      setIsStarting(false);
      setError(language === 'ar' ? 'تعذر بدء الميكروفون.' : 'Could not start microphone capture.');
    }

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [isOpen, language]);

  const stopListening = () => recognitionRef.current?.stop();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-8 text-center space-y-6 overflow-hidden">
        <div className="flex justify-end -mt-2 -me-2">
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-accent-500 via-accent-600 to-yellow-500 text-white flex items-center justify-center shadow-xl shadow-accent-500/30 transition-transform ${isListening ? 'animate-pulse scale-110' : ''}`}>
            {isStarting ? <Loader2 className="w-10 h-10 animate-spin" /> : isListening ? <Mic className="w-10 h-10" /> : <MicOff className="w-10 h-10" />}
          </div>
          {isListening && <div className="absolute inset-0 rounded-full border-4 border-accent-400/40 animate-ping" />}
        </div>

        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            {isStarting
              ? language === 'ar' ? 'جاري تشغيل الميكروفون...' : 'Starting microphone...'
              : isListening
                ? language === 'ar' ? 'اتكلم دلوقتي...' : 'Speak now...'
                : language === 'ar' ? 'انتهى الاستماع' : 'Listening ended'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar' ? 'التعرف الحقيقي مضبوط على العربية المصرية (ar-EG)' : 'Real recognition is configured for the selected locale'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-arabic font-bold text-slate-800 dark:text-slate-100 min-h-[76px] flex items-center justify-center">
          <span>{transcript || interimTranscript || (language === 'ar' ? 'في انتظار كلامك...' : 'Waiting for speech...')}</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 text-xs font-bold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {isListening && (
            <button onClick={stopListening} className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
              {language === 'ar' ? 'إيقاف الاستماع' : 'Stop listening'}
            </button>
          )}
          <button
            onClick={() => {
              if (transcript.trim()) onClose();
            }}
            disabled={!transcript.trim()}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-accent-500 to-yellow-600 hover:from-accent-600 hover:to-yellow-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-accent-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span>{language === 'ar' ? 'متابعة' : 'Continue'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
