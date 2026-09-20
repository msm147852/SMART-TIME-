import React, { useEffect, useRef, useState } from 'react';
import { Bot, Check, Copy, Mic, RotateCcw, Send, Sparkles, Zap } from 'lucide-react';
import { AiMessage, AiModelType, Language } from '../types';
import { ChatRepository } from '../services';
import { askSmartAi, buildSmartAiContext, SmartAiAction } from '../services/aiService';

interface AiCenterViewProps {
  language: Language;
  onOpenVoiceSearch: () => void;
  appContext: Parameters<typeof buildSmartAiContext>[0];
  onApplyAction: (action: SmartAiAction) => string;
}

export const AiCenterView: React.FC<AiCenterViewProps> = ({
  language,
  onOpenVoiceSearch,
  appContext,
  onApplyAction,
}) => {
  const selectedModel: AiModelType = 'smart-time-core';
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<SmartAiAction>(null);
  const [actionStatus, setActionStatus] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = ChatRepository.getAiChatHistory();
    if (saved?.length) {
      setMessages(saved);
      return;
    }
    const welcome: AiMessage = {
      id: 'msg_welcome',
      sender: 'ai',
      text:
        language === 'ar'
          ? 'مرحبًا بك في SMART AI. أقدر أقرأ بيانات المصاريف والدخل والرحلات والسيارات والطلاب والتذكيرات، وأساعدك في التحليل أو تجهيز عملية واضحة للتنفيذ.'
          : 'Welcome to SMART AI. I can analyze your SMART TIME data and prepare clear actions for you to confirm.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
      provider: 'smart-ai',
    };
    setMessages([welcome]);
    ChatRepository.saveAiChatHistory([welcome]);
  }, [language, selectedModel]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingAction]);

  const quickPrompts = [
    { ar: '📊 قارن مصاريف هذا الشهر بالشهر الماضي', en: 'Compare this month expenses to last month' },
    { ar: '💰 ما هو صافي دخلي هذا الشهر؟', en: 'What is my net income this month?' },
    { ar: '🚗 سجّل تموين السيارة', en: 'Record a fuel fill-up' },
    { ar: '🎓 أضف مصروفًا لطالب', en: 'Add an education expense' },
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMessage: AiMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
      provider: 'gemini',
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInputText('');
    setIsLoading(true);
    setPendingAction(null);
    setActionStatus('');

    try {
      const data = await askSmartAi({
        message: textToSend,
        language,
        model: selectedModel,
        conversationHistory: nextMessages.slice(-8).map((m) => ({
          sender: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        })),
        appContext: buildSmartAiContext(appContext),
      });

      const aiMessage: AiMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: data.reply || (language === 'ar' ? 'تعذر الحصول على رد واضح.' : 'No clear response was returned.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: (data.model as AiModelType) || selectedModel,
        provider: (data.provider as any) || 'gemini',
      };

      const finalMessages = [...nextMessages, aiMessage];
      setMessages(finalMessages);
      ChatRepository.saveAiChatHistory(finalMessages);
      setPendingAction(data.action || null);
      setActionStatus(data.actionSummary || '');
    } catch (error) {
      console.error('SMART AI chat failed:', error);
      const fallback: AiMessage = {
        id: 'msg_ai_error_' + Date.now(),
        sender: 'ai',
        text:
          language === 'ar'
            ? 'تعذر الاتصال بخدمة SMART AI الآن. تأكد من إعداد GEMINI_API_KEY على الخادم.'
            : 'SMART AI is unavailable right now. Check GEMINI_API_KEY on the server.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
        provider: 'gemini',
      };
      setMessages([...nextMessages, fallback]);
      ChatRepository.saveAiChatHistory([...nextMessages, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (index: number, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleClearChat = () => {
    setMessages([]);
    setPendingAction(null);
    setActionStatus('');
    ChatRepository.clearAiChatHistory();
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    try {
      const result = onApplyAction(pendingAction);
      setActionStatus(result);
      setPendingAction(null);
    } catch (error: any) {
      setActionStatus(error?.message || 'تعذر تنفيذ الإجراء.');
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] flex flex-col space-y-4" id="ai-center-module">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>SMART AI</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold">
                Gemini
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ar'
                ? 'يفهم بيانات SMART TIME ويمكنه تجهيز إجراءات قابلة للتنفيذ'
                : 'Understands SMART TIME data and can prepare actionable requests'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
            ✨ SMART TIME AI
          </span>
          <button
            type="button"
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-xl"
            title="مسح المحادثة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isAi = msg.sender !== 'user';
          return (
            <div
              key={msg.id || index}
              className={'flex items-start gap-3 ' + (isAi ? 'justify-start' : 'justify-end flex-row-reverse')}
            >
              <div
                className={
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ' +
                  (isAi ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white' : 'bg-slate-800 text-white')
                }
              >
                {isAi ? <Sparkles className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={
                  'max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ' +
                  (isAi
                    ? 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800'
                    : 'bg-purple-600 text-white')
                }
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className="flex items-center justify-between gap-4 pt-2 text-[10px] opacity-70">
                  <span>{msg.timestamp}</span>
                  {isAi && (
                    <button
                      type="button"
                      onClick={() => handleCopy(index, msg.text)}
                      className="flex items-center gap-1 hover:opacity-100"
                    >
                      {copiedIndex === index ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === index ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 animate-pulse text-purple-500" />
            <span>{language === 'ar' ? 'SMART AI يفكر...' : 'SMART AI is thinking...'}</span>
          </div>
        )}

        {pendingAction && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 p-3.5">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
              <Zap className="w-4 h-4" />
              <span>إجراء جاهز للتنفيذ</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80 mt-1.5 leading-relaxed">
              {actionStatus || 'راجعه ثم اختر تنفيذ لإضافته إلى بيانات SMART TIME.'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700"
              >
                تنفيذ
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingAction(null);
                  setActionStatus('تم إلغاء التنفيذ.');
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {actionStatus && !pendingAction && (
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{actionStatus}</div>
        )}

        <div ref={chatBottomRef} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt.ar}
            type="button"
            onClick={() => handleSendMessage(language === 'ar' ? prompt.ar : prompt.en)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-semibold shrink-0"
          >
            {language === 'ar' ? prompt.ar : prompt.en}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSendMessage();
        }}
        className="flex items-center gap-2 bg-white dark:bg-slate-850 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
      >
        <button
          type="button"
          onClick={onOpenVoiceSearch}
          className="p-2.5 text-slate-400 hover:text-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
          title="تسجيل صوتي"
        >
          <Mic className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder={
            language === 'ar'
              ? 'اكتب سؤالك أو اطلب إضافة مصروف أو تموين أو تذكير...'
              : 'Ask a question or request an expense, fuel record, or reminder...'
          }
          className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md shadow-purple-500/25 disabled:opacity-50 transition-all active:scale-95"
        >
          <Send className="w-4 h-4 rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
};
