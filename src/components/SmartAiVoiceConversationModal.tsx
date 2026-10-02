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
    results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
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

interface Props {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onTurn: (transcript: string) => Promise<void>;
}

export const SmartAiVoiceConversationModal: React.FC<Props> = ({
  isOpen,
  language,
  onClose,
  onTurn,
}) => {
  const [status, setStatus] = useState<'starting' | 'listening' | 'processing' | 'error'>('starting');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const finalTranscriptRef = useRef('');
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const onTurnRef = useRef(onTurn);

  useEffect(() => {
    onTurnRef.current = onTurn;
  }, [onTurn]);

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
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setStatus('starting');

    const recognition = new Ctor();
    recognition.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const startListening = () => {
      if (!activeRef.current || processingRef.current) return;
      try {
        recognition.start();
      } catch {
        // A browser may reject a duplicate start while a session is closing.
      }
    };

    recognition.onstart = () => {
      if (!activeRef.current) return;
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalChunk += text;
        else interim += text;
      }

      if (finalChunk.trim()) {
        finalTranscriptRef.current = [finalTranscriptRef.current, finalChunk.trim()]
          .filter(Boolean)
          .join(' ');
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onspeechend = () => {
      if (activeRef.current && !processingRef.current) recognition.stop();
    };

    recognition.onerror = (event) => {
      const code = event.error || 'unknown';
      if (!activeRef.current || code === 'aborted') return;
      processingRef.current = false;
      setStatus('error');
      setError(language === 'ar'
        ? `حصلت مشكلة في الميكروفون: ${code}`
        : `Microphone/recognition error: ${code}`);
    };

    recognition.onend = async () => {
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
        await onTurnRef.current(text);
      } catch {
        if (activeRef.current) {
          setStatus('error');
          setError(language === 'ar'
            ? 'تعذر الحصول على رد SMART AI.'
            : 'SMART AI could not return a response.');
        }
      } finally {
        finalTranscriptRef.current = '';
        setTranscript('');
        processingRef.current = false;
        if (activeRef.current) startListening();
      }
    };

    recognitionRef.current = recognition;
    startListening();

    return () => {
      activeRef.current = false;
      processingRef.current = false;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [isOpen, language]);

  if (!isOpen) return null;

  const stopConversation = () => {
    activeRef.current = false;
    recognitionRef.current?.abort();
    onClose();
  };

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
              ? (language === 'ar' ? 'أنا سامعك… اتكلم براحتك' : 'I’m listening… take your time')
              : status === 'processing'
                ? (language === 'ar' ? 'لحظة… SMART AI بيرد عليك' : 'One moment… SMART AI is replying')
                : status === 'starting'
                  ? (language === 'ar' ? 'جاري تشغيل المحادثة الصوتية…' : 'Starting voice conversation…')
                  : (language === 'ar' ? 'المحادثة الصوتية توقفت' : 'Voice conversation stopped')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar'
              ? 'هستنى لحد ما تخلص كلامك، وبعدها SMART AI هيرد عليك صوتيًا.'
              : 'I’ll wait until you finish, then SMART AI will answer by voice.'}
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
