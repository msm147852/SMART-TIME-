import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Sparkles, Navigation, DollarSign, BookOpen, UtensilsCrossed, Car } from 'lucide-react';
import { Language, AppView } from '../types';
import { translations } from '../services/i18n';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onNavigate: (view: AppView) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  language,
  onNavigate,
}) => {
  const t = translations[language];
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);

  // Simulated Voice recognition speech stream
  useEffect(() => {
    if (!isOpen) return;

    setIsListening(true);
    setTranscript('');
    setDetectedIntent(null);

    const timer1 = setTimeout(() => {
      setTranscript(
        language === 'ar' ? 'أريد معرفة أسعار المشاوير من البيت إلى العمل...' : 'Compare ride prices to work...'
      );
    }, 1200);

    const timer2 = setTimeout(() => {
      setDetectedIntent(language === 'ar' ? 'التعرف على النية: حجز ومقارنة أسعار المواصلات' : 'Intent: Compare Rides');
      setIsListening(false);
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, language]);

  if (!isOpen) return null;

  const handleExecuteVoiceAction = (view: AppView) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-8 text-center space-y-6 overflow-hidden">
        <div className="flex justify-end -mt-2 -me-2">
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Voice Orb */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 transition-transform ${
              isListening ? 'animate-pulse scale-110' : ''
            }`}
          >
            {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <MicOff className="w-10 h-10" />}
          </div>
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-amber-400/40 animate-ping" />
          )}
        </div>

        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            {isListening
              ? language === 'ar'
                ? 'استمع لصوتك الآن...'
                : 'Listening to your voice...'
              : language === 'ar'
              ? 'تم التعرف على الأمر الصوتي!'
              : 'Voice command recognized!'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar' ? 'تحدث بأي طلب أو اسم شاشة أو عملية حسابية' : 'Speak any request, screen name or math prompt'}
          </p>
        </div>

        {/* Live Transcript Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-arabic font-bold text-slate-800 dark:text-slate-100 min-h-[50px] flex items-center justify-center">
          {transcript || (language === 'ar' ? 'جاري الاستماع...' : 'Listening...')}
        </div>

        {detectedIntent && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{detectedIntent}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleExecuteVoiceAction('trips')}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-xs shadow-md shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span>{language === 'ar' ? 'فتح شاشة الرحلات والمقارنة' : 'Go to Trips'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
