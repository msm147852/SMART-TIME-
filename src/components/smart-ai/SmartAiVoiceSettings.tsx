import React from 'react';
import { Settings2, Volume2 } from 'lucide-react';

interface SmartAiVoiceSettingsProps {
  language: 'ar' | 'en';
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onStop: () => void;
  voiceLabel?: string;
}

export const SmartAiVoiceSettings: React.FC<SmartAiVoiceSettingsProps> = ({
  language,
  enabled,
  onEnabledChange,
  onStop,
  voiceLabel,
}) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
    <Settings2 className="w-4 h-4 text-accent-500" />
    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
      {voiceLabel || (language === 'ar' ? 'صوت SMART AI' : 'SMART AI voice')}
    </span>
    <button
      type="button"
      onClick={() => onEnabledChange(!enabled)}
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${enabled ? 'bg-accent-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
      aria-pressed={enabled}
    >
      {enabled ? (language === 'ar' ? 'مفعل' : 'On') : (language === 'ar' ? 'متوقف' : 'Off')}
    </button>
    <button
      type="button"
      onClick={onStop}
      className="p-1.5 rounded-lg text-slate-400 hover:text-accent-500"
      title={language === 'ar' ? 'إيقاف الصوت' : 'Stop voice'}
    >
      <Volume2 className="w-3.5 h-3.5" />
    </button>
  </div>
);
