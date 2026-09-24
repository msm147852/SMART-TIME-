import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

export interface SmartAiSystemVoice {
  id: string;
  label: string;
  path: string;
}

interface SmartAiVoicePickerProps {
  language: 'ar' | 'en';
  selectedVoiceId: string;
  systemVoices: SmartAiSystemVoice[];
  familyVoices: SmartAiSystemVoice[];
  onChange: (id: string) => void;
  onPreview?: (voice: SmartAiSystemVoice) => void;
}

export const SmartAiVoicePicker: React.FC<SmartAiVoicePickerProps> = ({
  language,
  selectedVoiceId,
  systemVoices,
  familyVoices,
  onChange,
  onPreview,
}) => {
  const allVoices = [...systemVoices, ...familyVoices];
  return (
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-xl bg-accent-500/10 text-accent-500" title={language === 'ar' ? 'صوت SMART AI' : 'SMART AI voice'}>
        <Mic className="w-4 h-4" />
      </div>
      <select
        value={selectedVoiceId}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[190px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 outline-none"
        aria-label={language === 'ar' ? 'اختيار صوت SMART AI' : 'SMART AI voice selection'}
      >
        {systemVoices.length > 0 && <optgroup label={language === 'ar' ? 'الأصوات المدمجة' : 'Embedded voices'}>
          {systemVoices.map((voice) => <option key={voice.id} value={voice.id}>{voice.label}</option>)}
        </optgroup>}
        {familyVoices.length > 0 && <optgroup label={language === 'ar' ? 'أصوات العائلة' : 'Family voices'}>
          {familyVoices.map((voice) => <option key={voice.id} value={voice.id}>{voice.label}</option>)}
        </optgroup>}
        {allVoices.length === 0 && <option value="browser">{language === 'ar' ? 'صوت المتصفح' : 'Browser voice'}</option>}
      </select>
      {onPreview && (
        <button
          type="button"
          onClick={() => {
            const voice = allVoices.find((item) => item.id === selectedVoiceId);
            if (voice) onPreview(voice);
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-accent-500 hover:bg-accent-500/10"
          title={language === 'ar' ? 'تجربة الصوت' : 'Preview voice'}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
