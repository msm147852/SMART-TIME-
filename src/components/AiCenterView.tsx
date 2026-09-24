import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, Copy, Image, MapPin, Mic, Paperclip, RotateCcw, Send, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';
import { SmartVoiceDnaPanel } from './SmartVoiceDnaPanel';
import { SmartAiVoicePicker, type SmartAiSystemVoice } from './smart-ai/SmartAiVoicePicker';
import { SmartAiVoiceSettings } from './smart-ai/SmartAiVoiceSettings';
import { AiMessage, AiModelType, Language } from '../types';
import { ChatRepository } from '../services';
import { askSmartAi, buildSmartAiContext, SmartAiAction } from '../services/aiService';
import { loadSmartAiVoiceId, speakSmartAi, stopSmartAiVoice } from '../services/smartAiVoiceService';
import { listVoiceDnaProfiles, readVoiceDnaSample, type SmartVoiceDnaProfile } from '../services/smartVoiceDnaService';
import { getVoiceDnaStatus, synthesizeVoiceDna } from '../services/smartVoiceDnaClient';
import type { SmartAiVoiceId } from '../types';

interface AiCenterViewProps {
  language: Language;
  onOpenVoiceSearch: () => void;
  appContext: Parameters<typeof buildSmartAiContext>[0];
  onApplyAction: (action: SmartAiAction) => string;
}

const SYSTEM_VOICES_URL = '/assets/voices/system/voices.json';
const FAMILY_VOICES_KEY = 'smart_ai_family_voices';

function normalizeVoiceList(value: unknown): SmartAiSystemVoice[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item: any) => {
      if (!item || typeof item !== 'object') return [];
      const id = String(item.id || item.name || '');
      const path = String(item.path || item.url || '');
      if (!id || !path) return [];
      return [{ id, label: String(item.label || item.name || id), path }];
    });
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([id, path]) => {
    if (typeof path !== 'string') return [];
    const shortName = id.replace(/^system_/, '').replace(/_/g, ' ');
    return [{ id, label: shortName.replace(/\b\w/g, (c) => c.toUpperCase()), path }];
  });
}

export const AiCenterView: React.FC<AiCenterViewProps> = ({ language, onOpenVoiceSearch, appContext, onApplyAction }) => {
  const selectedModel: AiModelType = 'smart-time-core';
  const smartLanguage: 'ar' | 'en' = language === 'en' ? 'en' : 'ar';
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<SmartAiAction>(null);
  const [actionStatus, setActionStatus] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<SmartAiVoiceId>(() => loadSmartAiVoiceId());
  const [selectedVoiceId, setSelectedVoiceId] = useState('system_salma');
  const [systemVoices, setSystemVoices] = useState<SmartAiSystemVoice[]>([]);
  const [familyVoices, setFamilyVoices] = useState<SmartAiSystemVoice[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voiceDnaProfiles, setVoiceDnaProfiles] = useState<SmartVoiceDnaProfile[]>([]);
  const [selectedVoiceDnaId, setSelectedVoiceDnaId] = useState<string | null>(null);
  const [isVoiceDnaOpen, setIsVoiceDnaOpen] = useState(false);
  const [voicePlaybackBusy, setVoicePlaybackBusy] = useState(false);
  const [voiceDnaProviderReady, setVoiceDnaProviderReady] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void refreshVoiceDnaProfiles();
    void refreshVoiceDnaProviderStatus();
    void loadSystemVoices();
    loadFamilyVoices();
  }, []);

  const refreshVoiceDnaProviderStatus = async () => {
    try {
      const status = await getVoiceDnaStatus();
      setVoiceDnaProviderReady(status.configured && status.healthy);
    } catch {
      setVoiceDnaProviderReady(false);
    }
  };

  const loadSystemVoices = async () => {
    try {
      const response = await fetch(SYSTEM_VOICES_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('voices.json unavailable');
      const data = await response.json();
      const voices = normalizeVoiceList(data);
      setSystemVoices(voices);
      if (voices.length > 0) setSelectedVoiceId((current) => voices.some((v) => v.id === current) ? current : voices[0].id);
    } catch {
      setSystemVoices([]);
    }
  };

  const loadFamilyVoices = () => {
    try {
      const raw = localStorage.getItem(FAMILY_VOICES_KEY);
      setFamilyVoices(raw ? normalizeVoiceList(JSON.parse(raw)) : []);
    } catch {
      setFamilyVoices([]);
    }
  };

  useEffect(() => {
    if (!isVoiceDnaOpen) {
      void refreshVoiceDnaProfiles();
      void refreshVoiceDnaProviderStatus();
    }
  }, [isVoiceDnaOpen]);

  useEffect(() => {
    const saved = ChatRepository.getAiChatHistory();
    if (saved?.length) {
      setMessages(saved);
      return;
    }
    const welcome: AiMessage = {
      id: 'msg_welcome',
      sender: 'ai',
      text: language === 'ar' ? 'مرحبًا بك في SMART AI. اسألني عن بياناتك أو أعطني مهمة عملية وسأوضح النتيجة والخطوة المطلوبة قبل التنفيذ.' : 'Welcome to SMART AI. Ask about your data or give me a practical task; I will explain the result and required action before execution.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: 'smart-ai',
    };
    setMessages([welcome]);
    ChatRepository.saveAiChatHistory([welcome]);
  }, [language, selectedModel]);

  const refreshVoiceDnaProfiles = async () => {
    try {
      const profiles = await listVoiceDnaProfiles();
      setVoiceDnaProfiles(profiles);
      let saved: string | null = null;
      try { saved = localStorage.getItem('smart-time-selected-voice-dna'); } catch {}
      const preferred = saved && profiles.some((profile) => profile.id === saved) ? saved : profiles.find((profile) => profile.isDefault)?.id || profiles[0]?.id || null;
      setSelectedVoiceDnaId(preferred);
    } catch {
      setVoiceDnaProfiles([]);
      setSelectedVoiceDnaId(null);
    }
  };

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading, pendingAction]);
  useEffect(() => () => stopSmartAiVoice(), []);

  const selectedVoiceDnaProfile = voiceDnaProfiles.find((profile) => profile.id === selectedVoiceDnaId) || null;
  const latestAiMessage = useMemo(() => [...messages].reverse().find((message) => message.sender !== 'user') || null, [messages]);
  const questionMessages = useMemo(() => latestAiMessage ? messages.filter((message) => message.id !== latestAiMessage.id) : messages, [messages, latestAiMessage]);

  const playEmbeddedVoice = async (voice: SmartAiSystemVoice, text: string): Promise<boolean> => {
    if (!voice.path || !text.trim()) return false;
    try {
      const audio = new Audio(voice.path);
      audio.preload = 'auto';
      setVoicePlaybackBusy(true);
      await audio.play();
      audio.onended = () => setVoicePlaybackBusy(false);
      return true;
    } catch {
      setVoicePlaybackBusy(false);
      return false;
    }
  };

  const speakWithSelectedVoice = async (text: string): Promise<boolean> => {
    if (!text.trim()) return false;
    const embedded = [...systemVoices, ...familyVoices].find((voice) => voice.id === selectedVoiceId);
    if (embedded && await playEmbeddedVoice(embedded, text)) return true;
    if (!selectedVoiceDnaProfile) return speakSmartAi(text, smartLanguage, selectedVoice);
    setVoicePlaybackBusy(true);
    try {
      const sample = await readVoiceDnaSample(selectedVoiceDnaProfile.id);
      if (!sample) throw new Error('Voice DNA sample not found');
      const serverProfileId = selectedVoiceDnaProfile.id.startsWith('shared_') ? selectedVoiceDnaProfile.id.slice('shared_'.length) : selectedVoiceDnaProfile.id;
      const canUseVoice = selectedVoiceDnaProfile.ownerConfirmed && (selectedVoiceDnaProfile.relationship !== 'son' && selectedVoiceDnaProfile.relationship !== 'daughter' ? true : selectedVoiceDnaProfile.guardianConfirmed);
      if (!canUseVoice) throw new Error('Voice consent is incomplete');
      const audioBlob = await synthesizeVoiceDna({ profileId: serverProfileId, text, speakingStyle: selectedVoiceDnaProfile.speakingStyle, consentConfirmed: true, referenceText: selectedVoiceDnaProfile.language === 'ar' ? 'أنا صاحب الصوت، وأوافق على إنشاء ملف صوتي خاص بي داخل SMART TIME.' : 'I am the voice owner, and I consent to creating my private SMART TIME voice profile.', referenceAudio: sample });
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      await new Promise<void>((resolve, reject) => {
        const done = () => { URL.revokeObjectURL(url); setVoicePlaybackBusy(false); resolve(); };
        audio.onended = done;
        audio.onerror = () => { URL.revokeObjectURL(url); setVoicePlaybackBusy(false); reject(new Error('Audio playback failed')); };
        void audio.play().catch(reject);
      });
      return true;
    } catch (error) {
      setVoicePlaybackBusy(false);
      console.error('SMART VOICE DNA playback failed:', error);
      return false;
    }
  };

  const quickPrompts = [
    { ar: '📊 قارن مصاريف هذا الشهر بالشهر الماضي', en: 'Compare this month expenses to last month' },
    { ar: '💰 ما هو صافي دخلي هذا الشهر؟', en: 'What is my net income this month?' },
    { ar: '🚗 سجّل تموين السيارة', en: 'Record a fuel fill-up' },
    { ar: '🎓 أضف مصروفًا لطالب', en: 'Add an education expense' },
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoading) return;
    const userMessage: AiMessage = { id: 'msg_' + Date.now(), sender: 'user', text: textToSend, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), provider: 'smart-ai' };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages); setInputText(''); setIsLoading(true); setPendingAction(null); setActionStatus('');
    try {
      const data = await askSmartAi({ message: textToSend, language: smartLanguage, conversationHistory: nextMessages.slice(-8).map((m) => ({ sender: m.sender === 'user' ? 'user' : 'model', text: m.text })), appContext: buildSmartAiContext(appContext) });
      if (isVoiceEnabled && data.reply) void speakWithSelectedVoice(data.reply);
      const aiMessage: AiMessage = { id: 'msg_ai_' + Date.now(), sender: 'ai', text: data.reply || (language === 'ar' ? 'تعذر الحصول على رد واضح.' : 'No clear response was returned.'), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), model: (data.model as AiModelType) || selectedModel, provider: (data.provider as any) || 'smart-ai' };
      const finalMessages = [...nextMessages, aiMessage];
      setMessages(finalMessages); ChatRepository.saveAiChatHistory(finalMessages); setPendingAction(data.action || null); setActionStatus(data.actionSummary || '');
    } catch (error) {
      console.error('SMART AI chat failed:', error);
      const fallback: AiMessage = { id: 'msg_ai_error_' + Date.now(), sender: 'ai', text: language === 'ar' ? 'تعذر تشغيل SMART AI الآن. لم يتم تعديل أي بيانات.' : 'SMART AI is unavailable right now. No app data was changed.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), provider: 'smart-ai' };
      setMessages([...nextMessages, fallback]); ChatRepository.saveAiChatHistory([...nextMessages, fallback]);
    } finally { setIsLoading(false); }
  };

  const handleCopy = (index: number, text: string) => { navigator.clipboard?.writeText(text); setCopiedIndex(index); window.setTimeout(() => setCopiedIndex(null), 1500); };
  const handleClearChat = () => { setMessages([]); setPendingAction(null); setActionStatus(''); ChatRepository.clearAiChatHistory(); };
  const handleConfirmAction = () => {
    if (!pendingAction) return;
    try { const result = onApplyAction(pendingAction); setActionStatus(result); setPendingAction(null); } catch (error: any) { setActionStatus(error?.message || 'تعذر تنفيذ الإجراء.'); }
  };
  const selectedVoiceLabel = [...systemVoices, ...familyVoices].find((voice) => voice.id === selectedVoiceId)?.label;

  return (
    <div className="h-[calc(100vh-140px)] min-h-[620px] flex flex-col gap-4" id="ai-center-module">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-3"><div className="p-2.5 rounded-2xl bg-accent-500 text-white shadow-lg shadow-accent-500/20"><Sparkles className="w-5 h-5" /></div><div><h2 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2"><span>SMART AI</span><span className="px-2 py-0.5 text-[10px] rounded-full bg-theme-ocean/10 text-accent-500 font-extrabold">Core</span></h2><p className="text-xs text-slate-400">{language === 'ar' ? 'مساحة ذكاء عملية: فهم، نتيجة، سؤال، ثم تنفيذ مؤكد' : 'An AI workspace for understanding, results, questions and confirmed actions'}</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><SmartAiVoicePicker language={smartLanguage} selectedVoiceId={selectedVoiceId} systemVoices={systemVoices} familyVoices={familyVoices} onChange={setSelectedVoiceId} onPreview={(voice) => { void playEmbeddedVoice(voice, language === 'ar' ? 'أهلًا بك في SMART AI.' : 'Welcome to SMART AI.'); }} /><SmartAiVoiceSettings language={smartLanguage} enabled={isVoiceEnabled} onEnabledChange={async (enabled) => { setIsVoiceEnabled(enabled); if (!enabled) stopSmartAiVoice(); else await speakWithSelectedVoice(language === 'ar' ? 'أهلًا بك في SMART AI.' : 'Welcome to SMART AI.'); }} onStop={stopSmartAiVoice} voiceLabel={selectedVoiceLabel} /><button type="button" onClick={() => setIsVoiceDnaOpen((open) => !open)} className="px-3 py-2 rounded-xl bg-theme-ocean/10 text-accent-500 text-xs font-bold border border-accent-500/20">Voice DNA</button><button type="button" onClick={handleClearChat} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl" title={language === 'ar' ? 'مسح المحادثة' : 'Clear chat'}><RotateCcw className="w-4 h-4" /></button></div>
      </header>

      {isVoiceDnaOpen && <SmartVoiceDnaPanel language={language} onClose={() => setIsVoiceDnaOpen(false)} />}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <section className="min-h-0 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-y-auto p-5 sm:p-7"><div className="flex items-center justify-between gap-3 mb-5"><div><div className="text-[10px] uppercase tracking-[0.18em] text-accent-500 font-black">SMART AI RESULT</div><h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{language === 'ar' ? 'النتيجة الرئيسية' : 'Main result'}</h3></div><div className="flex items-center gap-2 text-[10px] text-slate-400"><MapPin className="w-3.5 h-3.5" /> {language === 'ar' ? 'داخل SMART TIME' : 'Inside SMART TIME'}</div></div>{latestAiMessage ? <div className="rounded-3xl border border-accent-500/15 bg-theme-ocean/5 dark:bg-theme-ocean/10 p-5 sm:p-7"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-2xl bg-accent-500 text-white flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div><div className="min-w-0 flex-1"><div className="whitespace-pre-wrap text-sm sm:text-base leading-8 text-slate-800 dark:text-slate-100">{latestAiMessage.text}</div><div className="flex flex-wrap items-center gap-4 pt-5 text-[10px] text-slate-400"><span>{latestAiMessage.timestamp}</span><button type="button" onClick={() => { void speakWithSelectedVoice(latestAiMessage.text); }} className="flex items-center gap-1 hover:text-accent-500"><Volume2 className="w-3 h-3" />{language === 'ar' ? 'استماع' : 'Listen'}</button><button type="button" onClick={() => handleCopy(messages.indexOf(latestAiMessage), latestAiMessage.text)} className="flex items-center gap-1 hover:text-accent-500">{copiedIndex === messages.indexOf(latestAiMessage) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copiedIndex === messages.indexOf(latestAiMessage) ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'نسخ' : 'Copy')}</button></div></div></div></div> : <div className="h-full min-h-[280px] flex items-center justify-center text-sm text-slate-400">{language === 'ar' ? 'ابدأ بسؤال أو مهمة عملية.' : 'Start with a question or practical task.'}</div>}{pendingAction && <div className="mt-5 rounded-3xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 p-5"><div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-sm"><Zap className="w-4 h-4" />{language === 'ar' ? 'تأكيد قبل التنفيذ' : 'Confirmation required'}</div><p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-2 leading-6">{actionStatus || (language === 'ar' ? 'راجع العملية ثم أكد قبل تعديل بيانات SMART TIME.' : 'Review the action and confirm before changing SMART TIME data.')}</p><div className="flex items-center gap-2 mt-4"><button type="button" onClick={handleConfirmAction} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-xs font-bold hover:opacity-90">{language === 'ar' ? 'تنفيذ' : 'Execute'}</button><button type="button" onClick={() => { setPendingAction(null); setActionStatus(language === 'ar' ? 'تم إلغاء التنفيذ.' : 'Execution cancelled.'); }} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button></div></div>}{actionStatus && !pendingAction && <div className="mt-4 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{actionStatus}</div>}</section>

        <aside className="min-h-0 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden"><div className="p-4 border-b border-slate-200 dark:border-slate-800"><div className="text-[10px] uppercase tracking-[0.18em] text-accent-500 font-black">QUESTIONS</div><h3 className="font-black text-sm text-slate-900 dark:text-white mt-1">{language === 'ar' ? 'الأسئلة والمحادثة' : 'Questions & chat'}</h3></div><div className="flex-1 overflow-y-auto p-4 space-y-3">{questionMessages.map((msg, index) => { const isAi = msg.sender !== 'user'; return <div key={msg.id || index} className={'flex items-start gap-2 ' + (isAi ? 'justify-start' : 'justify-end flex-row-reverse')}><div className={'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ' + (isAi ? 'bg-accent-500 text-white' : 'bg-slate-800 text-white')}>{isAi ? <Sparkles className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}</div><div className={'max-w-[85%] rounded-2xl px-3 py-2.5 text-[11px] leading-5 ' + (isAi ? 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100' : 'bg-accent-500 text-white')}>{msg.text}<div className="text-[9px] opacity-60 mt-1">{msg.timestamp}</div></div></div>; })}{isLoading && <div className="flex items-center gap-2 text-[11px] text-slate-500"><Sparkles className="w-3.5 h-3.5 animate-pulse text-accent-500" />{language === 'ar' ? 'SMART AI يفكر...' : 'SMART AI is thinking...'}</div>}<div ref={chatBottomRef} /></div><div className="p-3 border-t border-slate-200 dark:border-slate-800"><div className="flex flex-wrap gap-1.5">{quickPrompts.slice(0, 3).map((prompt) => <button key={prompt.ar} type="button" onClick={() => void handleSendMessage(language === 'ar' ? prompt.ar : prompt.en)} className="px-2.5 py-1.5 rounded-lg bg-theme-ocean/10 text-accent-500 border border-accent-500/15 text-[10px] font-semibold">{language === 'ar' ? prompt.ar : prompt.en}</button>)}</div></div></aside>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void handleSendMessage(); }} className="flex items-center gap-2 bg-white dark:bg-slate-850 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"><button type="button" onClick={onOpenVoiceSearch} className="p-2.5 text-slate-400 hover:text-accent-500 rounded-xl hover:bg-theme-ocean/10" title={language === 'ar' ? 'تسجيل صوتي' : 'Voice input'}><Mic className="w-5 h-5" /></button><button type="button" className="p-2.5 text-slate-400 hover:text-accent-500 rounded-xl hover:bg-theme-ocean/10" title={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}><Paperclip className="w-5 h-5" /></button><button type="button" className="p-2.5 text-slate-400 hover:text-accent-500 rounded-xl hover:bg-theme-ocean/10" title={language === 'ar' ? 'إضافة صورة' : 'Add image'}><Image className="w-5 h-5" /></button><input type="text" value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder={language === 'ar' ? 'اكتب سؤالًا أو مهمة عملية...' : 'Ask a question or give a practical task...'} className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none" /><button type="submit" disabled={!inputText.trim() || isLoading} className="p-2.5 bg-accent-500 text-white rounded-xl shadow-md shadow-accent-500/25 disabled:opacity-50 transition-all active:scale-95"><Send className="w-4 h-4 rtl:rotate-180" /></button></form>
      {voicePlaybackBusy && <div className="text-[10px] text-accent-500 font-semibold text-center">{language === 'ar' ? 'SMART AI يشغل الصوت...' : 'SMART AI is playing audio...'}</div>}
      <div className="sr-only">{voiceDnaProviderReady ? 'Voice DNA ready' : 'Voice DNA offline'}<VolumeX /></div>
    </div>
  );
};
