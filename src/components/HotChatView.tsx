import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Image,
  Paperclip,
  Mic,
  Smile,
  MoreVertical,
  CheckCheck,
  Check,
  Search,
  Phone,
  Video,
  Sparkles,
  Plus,
  Users,
  UserPlus,
  X,
  Hash,
  Lock,
  Globe,
  Pin,
  VolumeX,
  Archive,
  Trash2,
  Reply,
  Share2,
  Heart,
  ThumbsUp,
  Flame,
  Info,
  Settings,
  ShieldAlert,
  Clock,
  ChevronRight,
  CircleDot,
  FileText,
  MapPin,
  Camera,
  StopCircle,
  Play,
  UserCheck,
} from 'lucide-react';
import { ChatRoom, ChatMessage, Language } from '../types';
import { translations } from '../services/i18n';
import { ChatRepository } from '../services';

interface HotChatViewProps {
  language: Language;
}

interface StoryItem {
  id: string;
  name: string;
  avatar: string;
  hasNew: boolean;
  time: string;
}

export const HotChatView: React.FC<HotChatViewProps> = ({ language }) => {
  const isAr = language === 'ar';
  const t = translations[language];

  // Tabs: 'all' | 'private' | 'rooms'
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'rooms'>('all');

  // Rooms State
  const [rooms, setRooms] = useState<ChatRoom[]>(() => {
    const saved = ChatRepository.getChatRooms();
    return saved && saved.length > 0
      ? saved
      : [
          {
            id: 'room_family',
            title: isAr ? 'مجموعة العائلة 🏡' : 'Family Group 🏡',
            name: isAr ? 'مجموعة العائلة 🏡' : 'Family Group 🏡',
            type: 'group',
            avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=120&auto=format&fit=crop&q=80',
            lastMessage: isAr ? 'لا تنسوا موعد العشاء غداً إن شاء الله' : 'Dont forget dinner tomorrow',
            lastMessageTime: '08:45 م',
            unreadCount: 2,
            isOnline: true,
          },
          {
            id: 'room_work',
            title: isAr ? 'فريق العمل والمشاريع 🚀' : 'Work & Projects 🚀',
            name: isAr ? 'فريق العمل والمشاريع 🚀' : 'Work & Projects 🚀',
            type: 'group',
            avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
            lastMessage: isAr ? 'تم الانتهاء من مراجعة تقرير الميزانية' : 'Budget report reviewed',
            lastMessageTime: '06:12 م',
            unreadCount: 0,
            isOnline: true,
          },
          {
            id: 'room_doctor',
            title: isAr ? 'د. أحمد استشاري 🩺' : 'Dr. Ahmed Consultant 🩺',
            name: isAr ? 'د. أحمد استشاري 🩺' : 'Dr. Ahmed Consultant 🩺',
            type: 'direct',
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
            lastMessage: isAr ? 'التحاليل ممتازة وكل شيء طبيعي' : 'Tests are great',
            lastMessageTime: isAr ? 'أمس' : 'Yesterday',
            unreadCount: 0,
            isOnline: false,
          },
          {
            id: 'room_tech',
            title: isAr ? 'مجتمع التقنية والذكاء الاصطناعي 🤖' : 'Tech & AI Community 🤖',
            name: isAr ? 'مجتمع التقنية والذكاء الاصطناعي 🤖' : 'Tech & AI Community 🤖',
            type: 'public',
            avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80',
            lastMessage: isAr ? 'مستجدات نماذج الذكاء الاصطناعي اليوم' : 'Latest AI updates today',
            lastMessageTime: '10:15 ص',
            unreadCount: 5,
            isOnline: true,
          },
        ];
  });

  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || 'room_family');
  const [searchQuery, setSearchQuery] = useState('');

  // Stories List
  const [stories, setStories] = useState<StoryItem[]>([
    { id: 's1', name: isAr ? 'حالتي' : 'My Status', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', hasNew: false, time: isAr ? 'إضافة حالة' : 'Add Status' },
    { id: 's2', name: isAr ? 'محمد علي' : 'Mohamed Ali', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', hasNew: true, time: 'منذ 25 دقيقة' },
    { id: 's3', name: isAr ? 'ساره أحمد' : 'Sara Ahmed', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', hasNew: true, time: 'منذ ساعتين' },
    { id: 's4', name: isAr ? 'مهندس خالد' : 'Eng. Khaled', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', hasNew: false, time: 'منذ 4 ساعات' },
  ]);

  // Messages per room state
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({
    room_family: [
      { id: 'm1', roomId: 'room_family', senderId: 'user_2', senderName: 'ماما', text: isAr ? 'مساء الخير جميعاً، هل يحتاج أحد شيئاً من السوبرماركت؟' : 'Good evening everyone, does anyone need anything?', timestamp: '08:30 م', type: 'text', isOutgoing: false },
      { id: 'm2', roomId: 'room_family', senderId: 'me', senderName: isAr ? 'أنا' : 'Me', text: isAr ? 'مساء النور! تم تحديث قائمة المشتريات على تطبيق SMART TIME ✨' : 'Good evening! Shopping list updated on SMART TIME ✨', timestamp: '08:35 م', type: 'text', isOutgoing: true },
      { id: 'm3', roomId: 'room_family', senderId: 'user_3', senderName: 'أحمد', text: isAr ? 'ممتاز جداً! لا تنسوا موعد العشاء غداً إن شاء الله' : 'Wonderful! Dont forget dinner tomorrow', timestamp: '08:45 م', type: 'text', isOutgoing: false },
    ],
    room_work: [
      { id: 'mw1', roomId: 'room_work', senderId: 'boss', senderName: 'المدير التنفيذي', text: isAr ? 'كيف سير العمل في مشروع الذكاء الاصطناعي؟' : 'How is progress on the AI project?', timestamp: '05:00 م', type: 'text', isOutgoing: false },
      { id: 'mw2', roomId: 'room_work', senderId: 'me', senderName: isAr ? 'أنا' : 'Me', text: isAr ? 'تم الانتهاء من مراجعة تقرير الميزانية وجاهز للعرض' : 'Budget report review finished and ready', timestamp: '06:12 م', type: 'text', isOutgoing: true },
    ],
  });

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomType, setNewRoomType] = useState<'group' | 'direct' | 'public'>('group');
  const [newRoomAvatar, setNewRoomAvatar] = useState('https://images.unsplash.com/photo-1543269865-cbf427effbad?w=120&auto=format&fit=crop&q=80');
  
  // Room Info / Settings Modal
  const [showRoomInfoModal, setShowRoomInfoModal] = useState(false);
  const [disappearingMessages, setDisappearingMessages] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const presetAvatars = [
    { url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=120&auto=format&fit=crop&q=80', label: 'عائلة 🏡' },
    { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80', label: 'عمل 💼' },
    { url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=120&auto=format&fit=crop&q=80', label: 'أصدقاء ☕' },
    { url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80', label: 'تقنية 🤖' },
  ];

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0] || {
    id: 'room_default',
    title: isAr ? 'محادثة' : 'Chat',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=120&auto=format&fit=crop&q=80',
    type: 'group',
    unreadCount: 0,
  };

  const currentMessages = messagesMap[activeRoomId] || [
    {
      id: 'default_1',
      roomId: activeRoomId,
      senderId: 'system',
      senderName: isAr ? 'النظام الآمن' : 'Secure System',
      text: isAr ? '🔒 هذه المحادثة مشفرة بنهاية لنهاية (End-to-End Encrypted).' : '🔒 This chat is end-to-end encrypted.',
      timestamp: 'الان',
      type: 'text',
      isOutgoing: false,
    }
  ];

  const handleSendMessage = (e?: React.FormEvent, customText?: string, customType?: 'text' | 'voice' | 'image') => {
    e?.preventDefault();
    const textToSend = customText !== undefined ? customText : inputText;
    if (!textToSend.trim() && customType !== 'voice') return;

    const newMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      roomId: activeRoomId,
      senderId: 'me',
      senderName: isAr ? 'أنا' : 'Me',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: customType || 'text',
      isOutgoing: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newMsg],
    }));

    if (!customText) setInputText('');
    setReplyingTo(null);

    // Update room last message
    const updatedRooms = rooms.map((r) =>
      r.id === activeRoomId
        ? {
            ...r,
            lastMessage: textToSend,
            lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        : r
    );
    setRooms(updatedRooms);
    ChatRepository.saveChatRooms(updatedRooms);
  };

  const startVoiceRecording = () => {
    setIsRecordingAudio(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const stopVoiceRecording = (send: boolean) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);
    if (send) {
      handleSendMessage(undefined, isAr ? `🎤 رسالة صوتية (${recordingSeconds} ثانية)` : `🎤 Voice Message (${recordingSeconds}s)`, 'voice');
    }
    setRecordingSeconds(0);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;

    const newRoom: ChatRoom = {
      id: 'room_' + Date.now(),
      title: newRoomTitle,
      name: newRoomTitle,
      type: newRoomType,
      avatar: newRoomAvatar,
      lastMessage: isAr ? 'تم إنشاء الغرفة بنجاح 🚀' : 'Room created successfully',
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unreadCount: 0,
      isOnline: true,
    };

    const updatedRooms = [newRoom, ...rooms];
    setRooms(updatedRooms);
    ChatRepository.saveChatRooms(updatedRooms);
    setActiveRoomId(newRoom.id);

    setMessagesMap((prev) => ({
      ...prev,
      [newRoom.id]: [
        {
          id: 'welcome_' + Date.now(),
          roomId: newRoom.id,
          senderId: 'system',
          senderName: isAr ? 'النظام' : 'System',
          text: isAr ? `🎉 أهلاً بك في غرفة "${newRoomTitle}". المحادثة محمية ومشفرة.` : `Welcome to "${newRoomTitle}". Encrypted.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          isOutgoing: false,
        },
      ],
    }));

    setNewRoomTitle('');
    setShowCreateModal(false);
  };

  const [isFloating, setIsFloating] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Filter rooms by tab & search query
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = (r.title || r.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'private') return r.type === 'direct';
    if (activeTab === 'rooms') return r.type === 'group' || r.type === 'public';
    return true; // 'all'
  });

  return (
    <div
      className={
        isFloating
          ? "fixed bottom-16 end-4 z-50 w-[95%] sm:w-[440px] h-[620px] grid grid-cols-1 md:grid-cols-12 bg-slate-900 text-white rounded-3xl border-2 border-[#D4AF37]/70 shadow-2xl overflow-hidden select-none animate-scaleUp"
          : mobileShowChat
          ? "w-full h-[calc(100vh-100px)] min-h-[680px] flex flex-col bg-slate-900 text-white rounded-3xl border border-[#D4AF37]/35 shadow-2xl overflow-hidden select-none"
          : "w-full h-[calc(100vh-130px)] min-h-[640px] grid grid-cols-1 md:grid-cols-12 bg-slate-900 text-white rounded-3xl border border-[#D4AF37]/35 shadow-2xl overflow-hidden select-none"
      }
      id="professional-chat-suite"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* LEFT / SIDEBAR: Chat List & Tabs (4 cols) */}
      <div className={`md:col-span-4 border-e border-slate-800 flex flex-col bg-[#161616] ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header & Stories */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-amber-600/10 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-bold shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                  {isAr ? 'المحادثات الذكية' : 'Smart Chat Suite'}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isAr ? 'متصل • تشفير تـام (E2EE)' : 'Online • E2EE Secured'}</span>
                </div>
              </div>
            </div>

            {/* Actions: Floating / Full Screen & Create */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFloating(!isFloating)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#D4AF37] transition-all"
                title={isFloating ? (isAr ? 'تكبير لملء الشاشة' : 'Full Screen') : (isAr ? 'تصغير كشاشة عائمة' : 'Floating Window')}
              >
                {isFloating ? <Plus className="w-4 h-4 rotate-45" /> : <div className="w-3.5 h-3.5 border-2 border-[#D4AF37] rounded-xs" />}
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#aa8c2c] hover:from-[#c29e2f] hover:to-[#967923] text-slate-950 font-extrabold text-xs shadow-md shadow-[#D4AF37]/20 active:scale-95 transition-all"
                id="fab-create-room"
                title={isAr ? 'إنشاء غرفة أو محادثة جديدة' : 'New Chat / Room'}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isAr ? 'جديد' : 'New'}</span>
              </button>
            </div>
          </div>

          {/* Stories / Status Bar */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {stories.map((story) => (
              <div key={story.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                <div className={`w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr ${story.hasNew ? 'from-[#D4AF37] via-amber-400 to-rose-500' : 'from-slate-700 to-slate-600'} group-hover:scale-105 transition-transform`}>
                  <img src={story.avatar} alt={story.name} className="w-full h-full rounded-full object-cover border-2 border-[#161616]" />
                </div>
                <span className="text-[10px] text-slate-300 font-medium truncate max-w-[56px]">{story.name}</span>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في المحادثات والغرف والرسائل...' : 'Search chats & rooms...'}
              className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]/60"
            />
          </div>

          {/* Tabs: الكل | الخاص | الغرف */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: isAr ? 'الكل' : 'All' },
              { id: 'private', label: isAr ? 'الخاص' : 'Private' },
              { id: 'rooms', label: isAr ? 'الغرف' : 'Rooms' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredRooms.map((room) => {
            const isSelected = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => {
                  setActiveRoomId(room.id);
                  setMobileShowChat(true);
                }}
                className={`w-full p-3.5 text-start flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'bg-[#D4AF37]/10 border-s-4 border-[#D4AF37]'
                    : 'hover:bg-slate-850/60'
                }`}
              >
                <div className="relative shrink-0">
                  <img src={room.avatar} alt={room.title || room.name} className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-sm" />
                  {room.isOnline && (
                    <span className="absolute -bottom-0.5 -end-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#161616] rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                      {room.title || room.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono-num">
                      {room.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 truncate">
                    {room.lastMessage}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {room.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-sm">
                      {room.unreadCount}
                    </span>
                  )}
                  <CheckCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>
              </button>
            );
          })}

          {filteredRooms.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#D4AF37]" />
              <p>{isAr ? 'لا توجد محادثات مطابقة' : 'No chats found'}</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT / MAIN AREA: Active Chat View (8 cols) */}
      <div className={`w-full h-full flex-1 flex flex-col bg-[#111111] relative ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
        {/* Header */}
        <div className="p-4 bg-[#1a1a1a] border-b border-slate-800 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-[#D4AF37] hover:bg-slate-700"
              title={isAr ? 'الرجوع للقائمة' : 'Back to list'}
            >
              <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <div className="relative">
              <img src={activeRoom.avatar} alt={activeRoom.title || activeRoom.name} className="w-11 h-11 rounded-2xl object-cover border border-[#D4AF37]/30 shadow" />
              {activeRoom.isOnline && (
                <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#1a1a1a] rounded-full" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">
                  {activeRoom.title || activeRoom.name}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>E2EE</span>
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? 'متصل الآن • آخر ظهور حديث' : 'Online • Active recently'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <button
              onClick={() => alert(isAr ? '📞 جاري بدء المكالمة الصوتية الآمنة...' : 'Starting secure voice call...')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-[#D4AF37] transition-all hover:scale-105"
              title={isAr ? 'مكالمة صوتية' : 'Voice Call'}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => alert(isAr ? '📹 جاري بدء مكالمة الفيديو...' : 'Starting video call...')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-[#D4AF37] transition-all hover:scale-105"
              title={isAr ? 'مكالمة فيديو' : 'Video Call'}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowRoomInfoModal(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-all hover:scale-105"
              title={isAr ? 'إعدادات وقائمة الأعضاء' : 'Room Settings & Members'}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-[#111111] to-[#161616]">
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isOutgoing ? 'items-end' : 'items-start'}`}
            >
              {!msg.isOutgoing && activeRoom.type !== 'direct' && (
                <span className="text-[10px] font-bold text-[#D4AF37] mb-1 px-1 flex items-center gap-1">
                  <span>{msg.senderName}</span>
                  <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300">مشرف</span>
                </span>
              )}

              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm shadow-md space-y-1.5 relative group ${
                  msg.isOutgoing
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#c29e2f] text-slate-950 font-medium rounded-br-xs'
                    : 'bg-[#222222] text-slate-100 border border-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Voice Message Simulation */}
                {msg.type === 'voice' ? (
                  <div className="flex items-center gap-3">
                    <button className="w-8 h-8 rounded-full bg-slate-900/30 flex items-center justify-center text-current">
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <div className="flex-1">
                      <div className="h-1 bg-current/30 rounded-full w-32 overflow-hidden">
                        <div className="h-full bg-current w-2/3" />
                      </div>
                      <span className="text-[10px] opacity-80 mt-0.5 block">0:14</span>
                    </div>
                  </div>
                ) : (
                  <div>{msg.text}</div>
                )}

                <div
                  className={`text-[9px] flex items-center justify-end gap-1 font-mono-num ${
                    msg.isOutgoing ? 'text-slate-900/80' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isOutgoing && <CheckCheck className="w-3 h-3 text-slate-950" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Audio Recording Overlay or Input Bar */}
        {isRecordingAudio ? (
          <div className="p-4 bg-[#1a1a1a] border-t border-slate-800 flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3 text-rose-500 font-bold text-xs animate-pulse">
              <Mic className="w-5 h-5" />
              <span>{isAr ? `جاري تسجيل الصوت... (${recordingSeconds} ثانية)` : `Recording... (${recordingSeconds}s)`}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stopVoiceRecording(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => stopVoiceRecording(true)}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-slate-950 text-xs font-extrabold shadow-md hover:bg-amber-400"
              >
                {isAr ? 'إرسال الصوت' : 'Send Voice'}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="p-3 bg-[#1a1a1a] border-t border-slate-800 flex items-center gap-2.5"
          >
            <button
              type="button"
              onClick={() => alert(isAr ? '📎 إرفاق ملف أو مستند أو صورة' : 'Attach file')}
              className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-[#D4AF37] transition-colors"
              title={isAr ? 'إرفاق ملف' : 'Attach'}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => alert(isAr ? '📷 التقاط صورة أو فيديو' : 'Capture photo')}
              className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-[#D4AF37] transition-colors"
              title={isAr ? 'صورة' : 'Image'}
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isAr ? 'اكتب رسالتك المشفرة هنا...' : 'Type your encrypted message...'}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]/60"
            />

            {inputText.trim() ? (
              <button
                type="submit"
                className="p-3 bg-[#D4AF37] hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-transform active:scale-95"
                title={isAr ? 'إرسال' : 'Send'}
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-[#D4AF37] rounded-xl shadow-md transition-transform active:scale-95"
                title={isAr ? 'تسجيل رسالة صوتية' : 'Record voice note'}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </div>

      {/* MODAL: Create New Room */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1c1c1c] border border-[#D4AF37]/40 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-white">
                  {isAr ? 'إنشاء غرفة أو محادثة جديدة' : 'Create Room or Chat'}
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isAr ? 'اسم الغرفة أو المحادثة *' : 'Room Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder={isAr ? 'مثال: رحلة العمل ✈️، العائلة 🏡' : 'e.g. Work Trip ✈️'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-[#D4AF37]/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isAr ? 'نوع الغرفة' : 'Room Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'group', label: isAr ? 'مجموعة 👥' : 'Group' },
                    { id: 'direct', label: isAr ? 'محادثة خاصة 👤' : 'Direct' },
                    { id: 'public', label: isAr ? 'قناة عامة 📢' : 'Channel' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setNewRoomType(type.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        newRoomType === type.id
                          ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-sm'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isAr ? 'اختر الأيقونة الرمزية' : 'Select Avatar'}
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {presetAvatars.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewRoomAvatar(av.url)}
                      className={`relative rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        newRoomAvatar === av.url ? 'border-[#D4AF37] scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-12 h-12 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-slate-950 shadow-md"
                >
                  {isAr ? 'إنشاء الغرفة الآن' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Room Info & Settings */}
      {showRoomInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1c1c1c] border border-[#D4AF37]/40 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm">
                  {isAr ? 'إعدادات الغرفة والأمان' : 'Room Settings & Security'}
                </h3>
              </div>
              <button onClick={() => setShowRoomInfoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <div className="font-bold text-white">{isAr ? 'تشفير تام (End-to-End E2EE)' : 'E2EE Encryption'}</div>
                  <div className="text-[10px] text-slate-400">{isAr ? 'الرسائل والمكالمات مؤمنة بالكامل' : 'Messages are fully secured'}</div>
                </div>
                <Lock className="w-5 h-5 text-[#D4AF37]" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <div className="font-bold text-white">{isAr ? 'الرسائل المؤقتة (Disappearing)' : 'Disappearing Messages'}</div>
                  <div className="text-[10px] text-slate-400">{isAr ? 'حذف الرسائل تلقائياً بعد 24 ساعة' : 'Auto delete after 24 hours'}</div>
                </div>
                <input
                  type="checkbox"
                  checked={disappearingMessages}
                  onChange={(e) => setDisappearingMessages(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <div className="font-bold text-white">{isAr ? 'كتم الإشعارات (Mute)' : 'Mute Notifications'}</div>
                  <div className="text-[10px] text-slate-400">{isAr ? 'إيقاف التنبيهات مؤقتاً' : 'Pause notifications'}</div>
                </div>
                <input
                  type="checkbox"
                  checked={isMuted}
                  onChange={(e) => setIsMuted(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <div className="font-bold mb-2 text-slate-300">{isAr ? 'الأعضاء المشتركون (4)' : 'Members (4)'}</div>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {[
                    { name: isAr ? 'محمد (أنت)' : 'Mohamed (You)', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
                    { name: isAr ? 'أحمد' : 'Ahmed', role: 'Member', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
                    { name: isAr ? 'سارة' : 'Sara', role: 'Member', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60">
                      <div className="flex items-center gap-2">
                        <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                        <span className="font-semibold">{m.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowRoomInfoModal(false)}
                className="px-5 py-2 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs shadow hover:bg-amber-400"
              >
                {isAr ? 'تم' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
