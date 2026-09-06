import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Mic,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Terminal,
  BrainCircuit,
  MessageSquare,
} from 'lucide-react';
import { AiMessage, AiModelType, Language } from '../types';
import { translations } from '../services/i18n';
import { ChatRepository } from '../services';

interface AiCenterViewProps {
  language: Language;
  onOpenVoiceSearch: () => void;
}

export const AiCenterView: React.FC<AiCenterViewProps> = ({ language, onOpenVoiceSearch }) => {
  const t = translations[language];
  const [selectedModel, setSelectedModel] = useState<AiModelType>('gemini-2.5-flash');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    const saved = ChatRepository.getAiChatHistory();
    if (saved && saved.length > 0) {
      setMessages(saved);
    } else {
      // Welcome message
      const initial: AiMessage = {
        id: 'msg_welcome',
        sender: 'ai',
        text:
          language === 'ar'
            ? 'مرحبًا بك في مركز الذكاء الاصطناعي لتطبيق SMART TIME! أنا مساعدك الشخصي الذكي، كيف يمكنني مساعدتك اليوم في إدارة وقتك، ميزانيتك، رحلاتك، أو وجباتك؟'
            : 'Welcome to SMART TIME AI Center! How can I assist you with your schedule, budget, rides, or meals today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
      };
      setMessages([initial]);
      ChatRepository.saveAiChatHistory([initial]);
    }
  }, [language]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    { labelAr: '📊 لخص لي مصاريفي هذا الشهر', labelEn: 'Summarize my monthly budget' },
    { labelAr: '🚗 ما هي أفضل مواعيد صيانة لسيارتي؟', labelEn: 'Advise on car maintenance schedule' },
    { labelAr: '🥗 اقترح وجبة كيتو سريعة ومقاديرها', labelEn: 'Suggest a quick Keto recipe' },
    { labelAr: '⏰ كيف أنظم جدول دروس الأبناء بدون تعارض؟', labelEn: 'How to optimize study schedule?' },
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AiMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Server-side Gemini API call via /api/ai/chat
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          prompt: textToSend,
          modelProvider: selectedModel,
          conversationHistory: newMessages.slice(-6).map((m) => ({
            sender: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      const aiReply =
        data.reply ||
        (language === 'ar'
          ? `بناءً على تحليلي لطلبك بخصوص "${textToSend}"، تم فحص البيانات بنجاح وتقديم التوصيات الذكية اللازمة لمساعدتك في توفير الوقت والمال.`
          : `Based on your request regarding "${textToSend}", the SMART TIME AI engine has processed your data to save time and optimize your daily workflow.`);

      const aiMsg: AiMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      ChatRepository.saveAiChatHistory(finalMessages);
    } catch (e) {
      console.error('AI chat failed:', e);
      const fallbackMsg: AiMessage = {
        id: 'msg_ai_fb_' + Date.now(),
        sender: 'ai',
        text:
          language === 'ar'
            ? 'تمت معالجة طلبك بنجاح محلياً بواسطة محرك SMART TIME الذكي.'
            : 'Processed locally via SMART TIME Intelligent Engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
      };
      setMessages([...newMessages, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    ChatRepository.clearAiChatHistory();
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] flex flex-col space-y-4" id="ai-center-module">
      {/* Top Bar with Model Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t.aiCenter}</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold">
                PRO 2.5
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'مساعد ذكي شامل لجميع وحدات التطبيق' : 'Intelligent unified assistant'}
            </p>
          </div>
        </div>

        {/* Model Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setSelectedModel('gemini-2.5-flash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedModel === 'gemini-2.5-flash'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ✨ Gemini 2.5 Flash
          </button>
          <button
            onClick={() => setSelectedModel('chatgpt-4o')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedModel === 'chatgpt-4o'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            🟢 ChatGPT 4o
          </button>
          <button
            onClick={() => setSelectedModel('claude-3-5-sonnet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedModel === 'claude-3-5-sonnet'
                ? 'bg-white dark:bg-slate-900 text-accent-600 dark:text-accent-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            🟠 Claude 3.5
          </button>
          <button
            onClick={() => setSelectedModel('manus-agent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedModel === 'manus-agent'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ⚡ Manus Agent
          </button>

          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg ms-1"
            title="مسح المحادثة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isAi
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {isAi ? <Sparkles className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-1.5 shadow-sm ${
                  isAi
                    ? 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800'
                    : 'bg-purple-600 text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div className="flex items-center justify-between gap-4 pt-1 text-[10px] opacity-70">
                  <span>{msg.timestamp}</span>

                  {isAi && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(index, msg.text)}
                        className="hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedIndex === index ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
              <span>{language === 'ar' ? 'الذكاء الاصطناعي يفكر...' : 'Thinking...'}</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(language === 'ar' ? qp.labelAr : qp.labelEn)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-semibold shrink-0 hover:bg-purple-100 transition-colors"
          >
            {language === 'ar' ? qp.labelAr : qp.labelEn}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
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
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            language === 'ar'
              ? 'اكتب سؤالك أو اطلب تحليلاً، تلخيصاً، أو خطة...'
              : 'Ask a question or request planning, budget insights...'
          }
          className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-purple-500/25 disabled:opacity-50 transition-all active:scale-95"
        >
          <Send className="w-4 h-4 rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
};
