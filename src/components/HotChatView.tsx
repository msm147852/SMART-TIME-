import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Image,
  Paperclip,
  Mic,
  Smile,
  MoreVertical,
  CheckCheck,
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
} from 'lucide-react';
import { ChatRoom, ChatMessage, Language } from '../types';
import { translations } from '../services/i18n';
import { ChatRepository } from '../services';

interface HotChatViewProps {
  language: Language;
}

export const HotChatView: React.FC<HotChatViewProps> = ({ language }) => {
  const t = translations[language];

  // Demo Chat Rooms from Repository or defaults
  const [rooms, setRooms] = useState<ChatRoom[]>(() => {
    const saved = ChatRepository.getChatRooms();
    return saved && saved.length > 0
      ? saved
      : [
          {
            id: 'room_family',
            title: 'مجموعة العائلة 🏡',
            name: 'مجموعة العائلة 🏡',
            type: 'group',
            avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=120&auto=format&fit=crop&q=80',
            lastMessage: 'لا تنسوا موعد العشاء غداً إن شاء الله',
            lastMessageTime: '08:45 م',
            unreadCount: 2,
            isOnline: true,
          },
          {
            id: 'room_work',
            title: 'فريق العمل والمشاريع 🚀',
            name: 'فريق العمل والمشاريع 🚀',
            type: 'group',
            avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
            lastMessage: 'تم الانتهاء من مراجعة تقرير الميزانية',
            lastMessageTime: '06:12 م',
            unreadCount: 0,
            isOnline: true,
          },
          {
            id: 'room_doctor',
            title: 'د. أحمد استشاري 🩺',
            name: 'د. أحمد استشاري 🩺',
            type: 'direct',
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
            lastMessage: 'التحاليل ممتازة وكل شيء طبيعي',
            lastMessageTime: 'أمس',
            unreadCount: 0,
            isOnline: false,
          },
        ];
  });

  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || 'room_family');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Room Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomType, setNewRoomType] = useState<'group' | 'direct' | 'public'>('group');
  const [newRoomAvatar, setNewRoomAvatar] = useState('https://images.unsplash.com/photo-1543269865-cbf427effbad?w=120&auto=format&fit=crop&q=80');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  const presetAvatars = [
    { url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=120&auto=format&fit=crop&q=80', label: 'عائلة 🏡' },
    { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80', label: 'عمل 💼' },
    { url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=120&auto=format&fit=crop&q=80', label: 'أصدقاء ☕' },
    { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', label: 'دراسة 📚' },
    { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&auto=format&fit=crop&q=80', label: 'رياضة 🏋️‍♂️' },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      senderId: 'user_2',
      senderName: 'ماما',
      text: 'مساء الخير جميعاً، هل يحتاج أحد شيئاً من السوبرماركت؟',
      timestamp: '08:30 م',
      type: 'text',
      isOutgoing: false,
    },
    {
      id: 'm2',
      senderId: 'me',
      senderName: 'أنا',
      text: 'مساء النور! تم تحديث قائمة المشتريات على تطبيق SMART TIME بمكونات وصفة اليوم ✨',
      timestamp: '08:35 م',
      type: 'text',
      isOutgoing: true,
    },
    {
      id: 'm3',
      senderId: 'user_3',
      senderName: 'أحمد',
      text: 'ممتاز جداً! لا تنسوا موعد العشاء غداً إن شاء الله',
      timestamp: '08:45 م',
      type: 'text',
      isOutgoing: false,
    },
  ]);

  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      roomId: activeRoomId,
      senderId: 'me',
      senderName: 'أنا',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      isOutgoing: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Update room's last message
    const updatedRooms = rooms.map((r) =>
      r.id === activeRoomId
        ? {
            ...r,
            lastMessage: inputText,
            lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        : r
    );
    setRooms(updatedRooms);
    ChatRepository.saveChatRooms(updatedRooms);
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
      lastMessage: newRoomDesc || (language === 'ar' ? 'تم إنشاء الغرفة بنجاح 🚀' : 'Room created successfully'),
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unreadCount: 0,
      isOnline: true,
    };

    const updatedRooms = [newRoom, ...rooms];
    setRooms(updatedRooms);
    ChatRepository.saveChatRooms(updatedRooms);

    // Set as active room and add welcome message
    setActiveRoomId(newRoom.id);
    const welcomeMsg: ChatMessage = {
      id: 'm_welcome_' + Date.now(),
      roomId: newRoom.id,
      senderId: 'system',
      senderName: 'النظام',
      text: `🎉 مرحباً بكم في غرفة "${newRoomTitle}"! الدردشة مشفرة ومحمية بالكامل.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      isOutgoing: false,
    };
    setMessages((prev) => [...prev, welcomeMsg]);

    // Reset & close
    setNewRoomTitle('');
    setNewRoomDesc('');
    setShowCreateModal(false);
  };

  const filteredRooms = rooms.filter((r) =>
    (r.title || r.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0] || {
    id: 'room_default',
    title: 'غرفة المحادثة',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=120&auto=format&fit=crop&q=80',
    type: 'group',
    unreadCount: 0,
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" id="hot-chat-module">
      {/* Rooms Sidebar (4 cols) */}
      <div className="md:col-span-4 border-e border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header & Create Room Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {t.hotChat}
                </h2>
                <span className="text-[10px] text-emerald-500 font-medium">● متصل فوري</span>
              </div>
            </div>

            {/* Create Room Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
              title={language === 'ar' ? 'إنشاء غرفة دردشة أو محادثة جديدة' : 'Create New Room'}
              id="create-chat-room-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إنشاء غرفة' : 'New Room'}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث في الغرف والمحادثات...' : 'Search rooms...'}
              className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filteredRooms.map((room) => {
            const isSelected = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full p-3.5 text-start flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-s-4 border-rose-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={room.avatar}
                    alt={room.title || room.name}
                    className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                  {room.isOnline && (
                    <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-850 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {room.title || room.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono-num">
                      {room.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {room.lastMessage}
                  </p>
                </div>

                {room.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {room.unreadCount}
                  </span>
                )}
              </button>
            );
          })}

          {filteredRooms.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{language === 'ar' ? 'لا توجد غرف تطابق البحث' : 'No rooms match your search'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Room Messages Area (8 cols) */}
      <div className="md:col-span-8 flex flex-col bg-slate-50/40 dark:bg-slate-900/40">
        {/* Room Header */}
        <div className="p-4 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={activeRoom.avatar}
              alt={activeRoom.title || activeRoom.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {activeRoom.title || activeRoom.name}
              </h3>
              <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>متصل الآن • تشفير كامل للرسائل</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <button
              onClick={() => alert(language === 'ar' ? 'جاري بدء مكالمة صوتية آمنة...' : 'Starting secure voice call...')}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="مكالمة صوتية"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => alert(language === 'ar' ? 'جاري بدء مكالمة فيديو عالية الدقة...' : 'Starting video call...')}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="مكالمة فيديو"
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isOutgoing ? 'items-end' : 'items-start'}`}
            >
              {!msg.isOutgoing && (
                <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">{msg.senderName}</span>
              )}

              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm space-y-1 ${
                  msg.isOutgoing
                    ? 'bg-rose-500 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                }`}
              >
                <div>{msg.text}</div>
                <div
                  className={`text-[9px] flex items-center justify-end gap-1 font-mono-num ${
                    msg.isOutgoing ? 'text-rose-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isOutgoing && <CheckCheck className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <button type="button" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <Paperclip className="w-4 h-4" />
          </button>
          <button type="button" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <Image className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب رسالة في الغرفة...' : 'Type a message in room...'}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md disabled:opacity-40 transition-transform active:scale-95"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>
      </div>

      {/* Modal: Create New Room */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <UserPlus className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === 'ar' ? 'إنشاء غرفة محادثة جديدة' : 'Create New Chat Room'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'اسم الغرفة أو المحادثة *' : 'Room Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: رحلة الإسكندرية 🌊، مشروع التخرج 🎓' : 'e.g. Family Trip, Project Team'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'نوع الغرفة' : 'Room Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'group', label: language === 'ar' ? 'مجموعة 👥' : 'Group' },
                    { id: 'direct', label: language === 'ar' ? 'محادثة خاصة 👤' : 'Direct' },
                    { id: 'public', label: language === 'ar' ? 'قناة عامة 📢' : 'Channel' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setNewRoomType(type.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        newRoomType === type.id
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'اختر الأيقونة أو الصورة الرمزية للغرفة' : 'Choose Room Avatar'}
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {presetAvatars.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewRoomAvatar(av.url)}
                      className={`relative rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        newRoomAvatar === av.url ? 'border-rose-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-12 h-12 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'وصف الغرفة أو ملاحظات (اختياري)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: نناقش هنا تفاصيل البرنامج والمواعيد...' : 'Describe what this room is for...'}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-500/25"
                  id="confirm-create-room-btn"
                >
                  {language === 'ar' ? 'إنشاء الغرفة الآن' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
