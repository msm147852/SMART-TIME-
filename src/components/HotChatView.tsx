import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Image,
  FileImage,
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
  Contact,
  ArrowRight,
  ArrowLeft,
  Navigation2,
  ShieldCheck,
  Shield,
  UserMinus,
  Crown,
  Ban,
  Link,
  Palette,
  Bell,
  BellOff,
  MessageCircleOff,
  CheckCircle2,
  SlidersHorizontal,
  BarChart3,
  Vote,
} from 'lucide-react';
import { ChatRoom, ChatMessage, ChatMember, ChatRoomPermissions, ChatRoomSettings, Language, ThemeMode, IconStyle } from '../types';
import { translations } from '../services/i18n';
import { ChatRepository } from '../services';

interface HotChatViewProps {
  language: Language;
  theme?: ThemeMode;
  iconStyle?: IconStyle;
  onNavigateHome?: () => void;
}

interface StoryItem {
  id: string;
  name: string;
  avatar: string;
  hasNew: boolean;
  time: string;
}

export const HotChatView: React.FC<HotChatViewProps> = ({ language, theme = 'light', iconStyle = 'classic', onNavigateHome }) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const isDark = theme === 'dark';
  const chatSurface = isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900';
  const chatPanel = isDark ? 'bg-[#1a1a1a]' : 'bg-slate-50';
  const chatStream = isDark ? 'bg-gradient-to-b from-[#111111] to-[#161616]' : 'bg-gradient-to-b from-slate-50 to-white';
  const chatBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const chatMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const chatIconButton = isDark ? 'bg-slate-800/80 hover:bg-slate-800' : 'bg-slate-100 hover:bg-slate-200';
  const chatInput = isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400';

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
  useEffect(() => {
    if (!rooms.some((r) => r.type === 'group')) {
      const groupRoom: ChatRoom = {
        id: 'room_family_default',
        title: isAr ? 'غرفة جماعية' : 'Group Room',
        name: isAr ? 'غرفة جماعية' : 'Group Room',
        type: 'group',
        avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=120&auto=format&fit=crop&q=80',
        lastMessage: isAr ? 'أنشئ مجموعتك وابدأ المحادثة' : 'Create your group and start chatting',
        lastMessageTime: '',
        unreadCount: 0,
        isOnline: true,
      };
      const updated = [groupRoom, ...rooms];
      setRooms(updated);
      ChatRepository.saveChatRooms(updated);
      setMessagesMap((prev) => ({ ...prev, [groupRoom.id]: [] }));
    }
  }, []);

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

  useEffect(() => {
    const savedMessages = ChatRepository.getChatMessages();
    if (savedMessages?.length) {
      setMessagesMap((prev) => {
        const next = { ...prev };
        savedMessages.forEach((message) => {
          if (!message.roomId) return;
          next[message.roomId] = next[message.roomId] || [];
          if (!next[message.roomId].some((m) => m.id === message.id)) next[message.roomId].push(message);
        });
        return next;
      });
    }
  }, []);

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const [activeCall, setActiveCall] = useState<'voice' | 'video' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCall = async (kind: 'voice' | 'video') => {
    setActiveCall(kind);
    if (kind === 'video' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(stream);
      } catch {
        // Permission can be denied; keep the call UI available.
      }
    }
  };

  const endCall = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setActiveCall(null);
  };

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => undefined);
    }
  }, [cameraStream]);

  useEffect(() => () => { cameraStream?.getTracks().forEach((track) => track.stop()); }, [cameraStream]);

  // Attachment Menu & Location Sharing
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollMultiple, setPollMultiple] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [chatBackground, setChatBackground] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [liveLocationWatchId, setLiveLocationWatchId] = useState<number | null>(null);
  const [liveLocationMsgId, setLiveLocationMsgId] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomType, setNewRoomType] = useState<'group' | 'direct' | 'public'>('group');
  const [newRoomAvatar, setNewRoomAvatar] = useState('https://images.unsplash.com/photo-1543269865-cbf427effbad?w=120&auto=format&fit=crop&q=80');
  const newRoomAvatarInputRef = useRef<HTMLInputElement | null>(null);
  
  // Room Info / Settings Modal
  const [showRoomInfoModal, setShowRoomInfoModal] = useState(false);
  const [roomSettingsTab, setRoomSettingsTab] = useState<'overview' | 'appearance' | 'chat' | 'permissions' | 'members'>('overview');
  const [roomMembers, setRoomMembers] = useState<ChatMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [disappearingMessages, setDisappearingMessages] = useState<ChatRoomSettings['disappearing']>('off');
  const [isMuted, setIsMuted] = useState(false);
  const [permissionRole, setPermissionRole] = useState<'admin' | 'moderator' | 'member'>('admin');
  const [roomPermissions, setRoomPermissions] = useState<ChatRoomPermissions>({
    sendMessages: true, sendMedia: true, addMembers: true, pinMessages: true,
    editRoom: true, deleteMessages: true, startCalls: true, mentionEveryone: true,
  });
  const [adminPermissions, setAdminPermissions] = useState<ChatRoomPermissions>({ sendMessages:true, sendMedia:true, addMembers:true, pinMessages:true, editRoom:true, deleteMessages:true, startCalls:true, mentionEveryone:true });
  const [moderatorPermissions, setModeratorPermissions] = useState<ChatRoomPermissions>({ sendMessages:true, sendMedia:true, addMembers:false, pinMessages:true, editRoom:false, deleteMessages:true, startCalls:true, mentionEveryone:true });
  const [roomPrefs, setRoomPrefs] = useState<ChatRoomSettings>({
    disappearing: 'off', muted: false, readReceipts: true, typingIndicator: true,
    linkPreviews: true, mediaAutoSave: false, enterToSend: true, slowModeSeconds: 0, approvalRequired: false,
  });
  const roomBackgroundInputRef = useRef<HTMLInputElement | null>(null);
  const roomAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const memberAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const [editingMemberAvatarId, setEditingMemberAvatarId] = useState<string | null>(null);
  const [longPressMemberId, setLongPressMemberId] = useState<string | null>(null);
  const [memberMenuPosition, setMemberMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const memberLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

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

  const isRoomOwner = (activeRoom.members?.find(m => m.role === 'owner')?.id || activeRoom.creatorId || 'me') === 'me';

  const defaultRoomMembers = (): ChatMember[] => [
    { id: 'me', name: isAr ? 'أنا' : 'Me', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', phone: '', role: 'owner', isOnline: true },
    { id: 'user_3', name: isAr ? 'أحمد' : 'Ahmed', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', phone: '+201000000001', role: 'admin', isOnline: true },
    { id: 'user_4', name: isAr ? 'سارة' : 'Sara', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', phone: '+201000000002', role: 'moderator', isOnline: true },
    { id: 'user_5', name: isAr ? 'خالد' : 'Khaled', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', phone: '+201000000003', role: 'member', isOnline: false },
  ];

  const activeRoomMembers = activeRoom.members?.length ? activeRoom.members : defaultRoomMembers();
  const activeMembers = activeRoomMembers
    .filter((member) => !member.banned && (member.isOnline ?? true))
    .slice()
    .sort((a, b) => {
      const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  const openRoomSettings = () => {
    const members = activeRoom.members?.length ? activeRoom.members : defaultRoomMembers();
    const settings = activeRoom.settings || { disappearing: 'off', muted: false, readReceipts: true, typingIndicator: true, linkPreviews: true, mediaAutoSave: false, enterToSend: true, slowModeSeconds: 0, approvalRequired: false };
    const permissions = activeRoom.permissions || { sendMessages: true, sendMedia: true, addMembers: true, pinMessages: true, editRoom: true, deleteMessages: true, startCalls: true, mentionEveryone: true };
    setRoomMembers(members);
    setRoomDescription(activeRoom.description || '');
    setRoomPrefs(settings);
    setDisappearingMessages(settings.disappearing);
    setIsMuted(settings.muted);
    setRoomPermissions(permissions);
    setAdminPermissions(activeRoom.adminPermissions || permissions);
    setModeratorPermissions(activeRoom.moderatorPermissions || { ...permissions, addMembers: false, editRoom: false });
    setRoomSettingsTab('overview');
    setShowRoomInfoModal(true);
  };

  const persistRoomConfig = (patch: Partial<ChatRoom>) => {
    const updated = rooms.map((r) => r.id === activeRoomId ? { ...r, ...patch } : r);
    setRooms(updated);
    ChatRepository.saveChatRooms(updated);
  };

  const saveRoomSettings = () => {
    const nextSettings = { ...roomPrefs, disappearing: disappearingMessages, muted: isMuted };
    persistRoomConfig({ description: roomDescription, members: roomMembers, permissions: roomPermissions, adminPermissions, moderatorPermissions, settings: nextSettings, background: chatBackground, avatarUrl: activeRoom.avatar });
    setRoomPrefs(nextSettings);
    setShowRoomInfoModal(false);
  };

  const addRoomMember = (member: ChatMember) => {
    if (roomMembers.some((m) => m.id === member.id)) return;
    setRoomMembers((prev) => [...prev, { ...member, role: 'member' }]);
  };

  const removeRoomMember = (id: string) => setRoomMembers((prev) => prev.filter((m) => m.id !== id || m.role === 'owner'));

  const startMemberLongPress = (id: string, event?: React.PointerEvent<HTMLDivElement>) => {
    if (!isRoomOwner) return;
    if (memberLongPressTimer.current) clearTimeout(memberLongPressTimer.current);
    memberLongPressTimer.current = setTimeout(() => {
      const rect = event?.currentTarget.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = 220;
      const gap = 6;
      let left = rect ? rect.right - menuWidth : window.innerWidth - menuWidth - 12;
      let top = rect ? rect.bottom + gap : 12;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
      if (top + menuHeight > window.innerHeight - 8) top = Math.max(8, (rect?.top || 12) - menuHeight - gap);
      setMemberMenuPosition({ top, left });
      setLongPressMemberId(id);
    }, 550);
  };
  const cancelMemberLongPress = () => {
    if (memberLongPressTimer.current) clearTimeout(memberLongPressTimer.current);
    memberLongPressTimer.current = null;
  };
  const closeMemberMenu = () => { setLongPressMemberId(null); setMemberMenuPosition(null); };

  const changeMemberRole = (id: string, role: ChatMember['role']) => setRoomMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m));
  const toggleRoomPref = (key: keyof ChatRoomSettings) => setRoomPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  const roomPrefEnabled = (key: keyof ChatRoomSettings) => Boolean(roomPrefs[key]);
  const activePermissions = permissionRole === 'admin' ? adminPermissions : permissionRole === 'moderator' ? moderatorPermissions : roomPermissions;
  const toggleRoomPermission = (key: keyof ChatRoomPermissions) => {
    if (permissionRole === 'admin') setAdminPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    else if (permissionRole === 'moderator') setModeratorPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    else setRoomPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const roomPermissionEnabled = (key: keyof ChatRoomPermissions) => Boolean(activePermissions[key]);

  const handleNewRoomAvatarFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 3 * 1024 * 1024) { alert(isAr ? 'صورة الأيقونة يجب ألا تتجاوز 3 ميجابايت.' : 'Icon image must be under 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setNewRoomAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleRoomAvatarFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 3 * 1024 * 1024) { alert(isAr ? 'صورة الأيقونة يجب ألا تتجاوز 3 ميجابايت.' : 'Icon image must be under 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const avatar = String(reader.result);
      const updated = rooms.map((r) => r.id === activeRoomId ? { ...r, avatar, avatarUrl: avatar } : r);
      setRooms(updated);
      ChatRepository.saveChatRooms(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleMemberAvatarFile = (file?: File) => {
    if (!file || !editingMemberAvatarId || !file.type.startsWith('image/')) return;
    if (file.size > 3 * 1024 * 1024) { alert(isAr ? 'صورة العضو يجب ألا تتجاوز 3 ميجابايت.' : 'Member image must be under 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setRoomMembers((prev) => prev.map((m) => m.id === editingMemberAvatarId ? { ...m, avatar: String(reader.result) } : m));
      setEditingMemberAvatarId(null);
    };
    reader.readAsDataURL(file);
  };

  const saveMemberToPhoneContacts = async (member: ChatMember) => {
    const safeName = member.name || (isAr ? 'عضو SMART TIME' : 'SMART TIME contact');
    const phone = member.phone?.trim();
    const vcard = [
      'BEGIN:VCARD', 'VERSION:3.0', `FN:${safeName.replace(/[\n\r]/g, ' ')}`, `N:${safeName.replace(/[\n\r]/g, ' ')};;;;`,
      phone ? `TEL;TYPE=CELL:${phone}` : '', `PHOTO;VALUE=URI:${member.avatar || ''}`, 'NOTE:SMART TIME contact', 'END:VCARD'
    ].filter(Boolean).join('\r\n');
    try {
      const file = new File([vcard], `${safeName.replace(/[^a-zA-Z0-9_\-أ-ي ]/g, '_')}.vcf`, { type: 'text/vcard' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: safeName, text: isAr ? 'جهة اتصال من SMART TIME' : 'SMART TIME contact', files: [file] });
        return;
      }
    } catch { /* user cancelled sharing */ }
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${safeName.replace(/[^a-zA-Z0-9_\-أ-ي ]/g, '_')}.vcf`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    alert(isAr ? 'تم تجهيز بطاقة جهة الاتصال. افتح ملف VCF على الهاتف لإضافتها إلى جهات الاتصال.' : 'The contact card is ready. Open the VCF file on your phone to add it to Contacts.');
  };

  const handleRoomBackgroundFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 3 * 1024 * 1024) { alert(isAr ? 'صورة الخلفية يجب ألا تتجاوز 3 ميجابايت.' : 'Wallpaper image must be under 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setChatBackground('');
      persistRoomConfig({ background: '', backgroundUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setChatBackground(activeRoom?.background || '');
  }, [activeRoomId]);

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

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFileAttachment = async (file: File, kind: 'image' | 'video' | 'file') => {
    setShowAttachMenu(false);
    if (file.size > 8 * 1024 * 1024) {
      alert(isAr ? 'الحد الأقصى للملف 8 ميجابايت في وضع المعاينة.' : 'Maximum file size is 8 MB in preview mode.');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const label = kind === 'image' ? `🖼️ ${file.name}` : kind === 'video' ? `🎬 ${file.name}` : `📄 ${file.name}`;
      handleSendMessage(undefined, label, kind, undefined, undefined, dataUrl);
    } catch {
      alert(isAr ? 'تعذر قراءة الملف.' : 'Unable to read the file.');
    }
  };

  const handleCameraCapture = async (file?: File) => {
    if (!file) return;
    await handleFileAttachment(file, file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file');
  };

  const updateRoomBackground = (background: string) => {
    setChatBackground(background);
    const updated = rooms.map((r) => r.id === activeRoomId ? { ...r, background, backgroundUrl: '' } : r);
    setRooms(updated);
    ChatRepository.saveChatRooms(updated);
  };

  const openGroupRoomCreator = () => {
    setNewRoomType('group');
    setShowCreateModal(true);
  };

  const createPoll = () => {
    const question = pollQuestion.trim();
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!question || options.length < 2) {
      alert(isAr ? 'اكتب السؤال وأضف خيارين على الأقل.' : 'Enter a question and at least two options.');
      return;
    }
    const poll = { question, options, votes: {} as Record<number, string[]>, multiple: pollMultiple };
    const newMsg: ChatMessage = {
      id: 'm_poll_' + Date.now(), roomId: activeRoomId, senderId: 'me', senderName: isAr ? 'أنا' : 'Me',
      text: `📊 ${question}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'poll', isOutgoing: true, poll,
    };
    setMessagesMap((prev) => ({ ...prev, [activeRoomId]: [...(prev[activeRoomId] || []), newMsg] }));
    ChatRepository.addChatMessage(newMsg);
    const updatedRooms = rooms.map((r) => r.id === activeRoomId ? { ...r, lastMessage: `📊 ${question}`, lastMessageTime: newMsg.timestamp } : r);
    setRooms(updatedRooms); ChatRepository.saveChatRooms(updatedRooms);
    setPollQuestion(''); setPollOptions(['', '']); setPollMultiple(false); setShowPollModal(false); setShowAttachMenu(false);
  };

  const votePoll = (messageId: string, optionIndex: number) => {
    setMessagesMap((prev) => {
      const list = prev[activeRoomId] || [];
      const updated = list.map((m) => {
        if (m.id !== messageId || !m.poll) return m;
        const votes = { ...(m.poll.votes || {}) };
        const mine = Object.entries(votes).filter(([, ids]) => ids.includes('me')).map(([i]) => Number(i));
        let selected = m.poll.multiple ? [...mine] : [];
        if (selected.includes(optionIndex)) selected = selected.filter((i) => i !== optionIndex); else selected.push(optionIndex);
        Object.keys(votes).forEach((k) => { votes[Number(k)] = (votes[Number(k)] || []).filter((id) => id !== 'me'); });
        selected.forEach((i) => { votes[i] = [...(votes[i] || []), 'me']; });
        const next = { ...m, poll: { ...m.poll, votes } };
        ChatRepository.saveChatMessages(list.map((x) => x.id === messageId ? next : x));
        return next;
      });
      return { ...prev, [activeRoomId]: updated };
    });
  };

  const handleSendMessage = (
    e?: React.FormEvent,
    customText?: string,
    customType?: 'text' | 'voice' | 'image' | 'video' | 'file' | 'location' | 'poll',
    customLocation?: { lat: number; lng: number; isLive?: boolean },
    customId?: string,
    customMediaUrl?: string
  ) => {
    e?.preventDefault();
    const textToSend = customText !== undefined ? customText : inputText;
    if (!textToSend.trim() && customType !== 'voice') return;

    const newMsg: ChatMessage = {
      id: customId || 'm_' + Date.now(),
      roomId: activeRoomId,
      senderId: 'me',
      senderName: isAr ? 'أنا' : 'Me',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: customType || 'text',
      isOutgoing: true,
      ...(customLocation ? { location: customLocation } : {}),
      ...(customMediaUrl ? { mediaUrl: customMediaUrl } : {}),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newMsg],
    }));
    ChatRepository.addChatMessage(newMsg);

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

  // Share a one-time snapshot of the current location
  const handleShareLocation = () => {
    setShowAttachMenu(false);
    if (!navigator.geolocation) {
      alert(isAr ? '⚠️ المتصفح لا يدعم تحديد الموقع' : '⚠️ Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSendMessage(
          undefined,
          isAr ? '📍 تمت مشاركة الموقع الحالي' : '📍 Current location shared',
          'location',
          { lat: pos.coords.latitude, lng: pos.coords.longitude, isLive: false }
        );
      },
      () => alert(isAr ? '⚠️ تعذر الوصول إلى الموقع، يرجى التأكد من تفعيل صلاحية الموقع' : '⚠️ Unable to access location, please check permissions'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Start sharing a continuously-updating live location
  const handleStartLiveLocation = () => {
    setShowAttachMenu(false);
    if (!navigator.geolocation) {
      alert(isAr ? '⚠️ المتصفح لا يدعم تحديد الموقع' : '⚠️ Geolocation not supported');
      return;
    }
    const msgId = 'm_live_' + Date.now();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSendMessage(
          undefined,
          isAr ? '📡 بدأت مشاركة الموقع المباشر' : '📡 Live location sharing started',
          'location',
          { lat: pos.coords.latitude, lng: pos.coords.longitude, isLive: true },
          msgId
        );
        setLiveLocationMsgId(msgId);

        const watchId = navigator.geolocation.watchPosition(
          (p) => {
            setMessagesMap((prev) => ({
              ...prev,
              [activeRoomId]: (prev[activeRoomId] || []).map((m) =>
                m.id === msgId
                  ? { ...m, location: { ...(m.location as any), lat: p.coords.latitude, lng: p.coords.longitude, isLive: true } }
                  : m
              ),
            }));
          },
          () => {},
          { enableHighAccuracy: true }
        );
        setLiveLocationWatchId(watchId);
      },
      () => alert(isAr ? '⚠️ تعذر الوصول إلى الموقع، يرجى التأكد من تفعيل صلاحية الموقع' : '⚠️ Unable to access location, please check permissions'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Stop an active live location share
  const handleStopLiveLocation = () => {
    if (liveLocationWatchId !== null) {
      navigator.geolocation.clearWatch(liveLocationWatchId);
    }
    if (liveLocationMsgId) {
      const stoppedId = liveLocationMsgId;
      setMessagesMap((prev) => ({
        ...prev,
        [activeRoomId]: (prev[activeRoomId] || []).map((m) =>
          m.id === stoppedId
            ? {
                ...m,
                text: isAr ? '📍 انتهت مشاركة الموقع المباشر' : '📍 Live location sharing ended',
                location: m.location ? { ...m.location, isLive: false } : m.location,
              }
            : m
        ),
      }));
    }
    setLiveLocationWatchId(null);
    setLiveLocationMsgId(null);
  };

  // Cleanup any active geolocation watcher when leaving the chat or switching rooms
  useEffect(() => {
    return () => {
      if (liveLocationWatchId !== null) {
        navigator.geolocation.clearWatch(liveLocationWatchId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;

    const newRoom: ChatRoom = {
      id: 'room_' + Date.now(),
      title: newRoomTitle,
      name: newRoomTitle,
      type: newRoomType,
      avatar: newRoomAvatar,
      creatorId: 'me',
      members: [{ id: 'me', name: isAr ? 'أنا' : 'Me', avatar: newRoomAvatar, role: 'owner' }],
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
          ? `fixed bottom-16 end-4 z-50 w-[95%] sm:w-[440px] h-[620px] grid grid-cols-1 md:grid-cols-12 ${chatSurface} rounded-3xl border-2 border-accent-500/70 shadow-2xl overflow-hidden select-none animate-scaleUp`
          : mobileShowChat
          ? `fixed inset-0 z-50 w-screen h-[100dvh] flex flex-col ${chatSurface} overflow-hidden select-none md:static md:z-auto md:w-full md:h-[calc(100vh-100px)] md:min-h-[680px] md:rounded-3xl md:border md:border-accent-500/35 md:shadow-2xl`
          : `w-full h-[calc(100vh-130px)] min-h-[640px] grid grid-cols-1 md:grid-cols-12 ${chatSurface} rounded-3xl border border-accent-500/35 shadow-2xl overflow-hidden select-none`
      }
      id="professional-chat-suite" data-icon-style={iconStyle} data-theme-mode={theme} dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* LEFT / SIDEBAR: Chat List & Tabs (4 cols) */}
      <div className={`md:col-span-4 border-e ${chatBorder} flex flex-col ${chatPanel} ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header & Stories */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 border border-accent-500/40 text-accent-500 flex items-center justify-center font-bold shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-wide">
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
                className={`p-2 rounded-xl ${chatIconButton} text-accent-500 transition-all`}
                title={isFloating ? (isAr ? 'تكبير لملء الشاشة' : 'Full Screen') : (isAr ? 'تصغير كشاشة عائمة' : 'Floating Window')}
              >
                {isFloating ? <Plus className="w-4 h-4 rotate-45" /> : <div className="w-3.5 h-3.5 border-2 border-accent-500 rounded-xs" />}
              </button>

              <button
                onClick={openGroupRoomCreator}
                className={`p-2 rounded-xl ${chatIconButton} text-accent-500 transition-all`}
                id="fab-create-group"
                title={isAr ? 'إنشاء غرفة جماعية' : 'Create group room'}
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 hover:from-accent-600 hover:to-accent-800 text-slate-950 font-extrabold text-xs shadow-md shadow-accent-500/20 active:scale-95 transition-all"
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
                <div className={`w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr ${story.hasNew ? 'from-accent-500 via-accent-400 to-rose-500' : 'from-slate-700 to-slate-600'} group-hover:scale-105 transition-transform`}>
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
              className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-accent-500/60"
            />
          </div>

          {/* Persistent Back Button -> Main Home Screen */}
          <button
            type="button"
            onClick={() => onNavigateHome?.()}
            id="chat-back-to-home-btn"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white dark:bg-slate-900 border border-accent-500/30 text-accent-500 hover:bg-slate-800 hover:border-accent-500/60 text-xs font-bold transition-all active:scale-[0.98]"
            title={isAr ? 'الرجوع إلى الواجهة الرئيسية' : 'Back to Home'}
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'الرجوع إلى الواجهة الرئيسية' : 'Back to Home'}</span>
          </button>

          {/* Tabs: الكل | الخاص | الغرف */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
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
                    ? 'bg-accent-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className={`flex-1 overflow-y-auto divide-y ${chatBorder}/60`}>
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
                    ? 'bg-accent-500/10 border-s-4 border-accent-500'
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
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {room.title || room.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono-num">
                      {room.lastMessageTime}
                    </span>
                  </div>

                  <p className={`text-xs ${chatMuted} truncate`}>
                    {room.lastMessage}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {room.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-accent-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-sm">
                      {room.unreadCount}
                    </span>
                  )}
                  <CheckCheck className="w-3.5 h-3.5 text-accent-500" />
                </div>
              </button>
            );
          })}

          {filteredRooms.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-accent-500" />
              <p>{isAr ? 'لا توجد محادثات مطابقة' : 'No chats found'}</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT / MAIN AREA: Active Chat View (8 cols) */}
      <div className={`w-full h-full flex-1 flex flex-col ${isDark ? 'bg-slate-950' : 'bg-white'} relative ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
        {/* Header */}
        <div className={`p-4 ${chatPanel} border-b ${chatBorder} flex items-center justify-between z-10 shadow-sm`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-accent-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              title={isAr ? 'الرجوع للقائمة' : 'Back to list'}
            >
              <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
            <div className="relative">
              <img src={activeRoom.avatar} alt={activeRoom.title || activeRoom.name} className="w-11 h-11 rounded-2xl object-cover border border-accent-500/30 shadow" />
              {activeRoom.isOnline && (
                <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1a1a1a] rounded-full" />
              )}
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {activeRoom.title || activeRoom.name}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-accent-500/20 text-accent-500 font-bold border border-accent-500/30 flex items-center gap-1">
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

          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
            <button
              onClick={() => startCall('voice')}
              className={`p-2.5 rounded-xl ${chatIconButton} text-accent-500 transition-all hover:scale-105`}
              title={isAr ? 'مكالمة صوتية' : 'Voice Call'}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => startCall('video')}
              className={`p-2.5 rounded-xl ${chatIconButton} text-accent-500 transition-all hover:scale-105`}
              title={isAr ? 'مكالمة فيديو' : 'Video Call'}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={openRoomSettings}
              className={`p-2.5 rounded-xl ${chatIconButton} text-slate-700 dark:text-slate-300 transition-all hover:scale-105`}
              title={isAr ? 'إعدادات وقائمة الأعضاء' : 'Room Settings & Members'}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active users sidebar — compact, scrollable, first-joined users stay at the top */}
        <aside className={`hidden lg:flex absolute end-0 top-[74px] bottom-0 w-56 flex-col border-s ${chatBorder} ${isDark ? 'bg-slate-900/95' : 'bg-slate-50/95'} backdrop-blur-sm z-[5]`}>
          <div className="px-3.5 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CircleDot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-black truncate">{isAr ? 'المستخدمون النشطون' : 'Active users'}</div>
                  <div className="text-[9px] text-slate-500">{activeMembers.length} {isAr ? 'متصل الآن' : 'online now'}</div>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {activeMembers.length ? activeMembers.map((member, index) => (
              <div key={member.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition" title={index < 8 ? (isAr ? `دخل الغرفة أولاً — رقم ${index + 1}` : `Joined early — #${index + 1}`) : undefined}>
                <div className="relative shrink-0">
                  <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold truncate">{member.name}</span>
                    {member.role === 'owner' && <Crown className="w-2.5 h-2.5 text-accent-500 shrink-0" />}
                  </div>
                  <div className="text-[9px] text-emerald-500 font-semibold truncate">{isAr ? 'نشط الآن' : 'Active now'}</div>
                </div>
              </div>
            )) : (
              <div className="p-5 text-center text-[10px] text-slate-500">{isAr ? 'لا يوجد مستخدمون نشطون حالياً' : 'No active users right now'}</div>
            )}
          </div>
          {activeMembers.length > 8 && (
            <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-500 text-center">
              {isAr ? 'يظهر الأعضاء الأقدم أولاً ويمكن التمرير لباقي المستخدمين' : 'Earliest joined users appear first; scroll for more'}
            </div>
          )}
        </aside>

        {/* Messages Stream */}
        <div className={`flex-1 p-4 sm:p-6 md:pe-64 overflow-y-auto space-y-4 ${chatStream}`} style={activeRoom?.backgroundUrl ? { backgroundImage: `url(${activeRoom.backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : chatBackground ? { backgroundImage: chatBackground } : undefined}>
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isOutgoing ? 'items-end' : 'items-start'}`}
            >
              {!msg.isOutgoing && activeRoom.type !== 'direct' && (
                <span className="text-[10px] font-bold text-accent-500 mb-1 px-1 flex items-center gap-1">
                  <span>{msg.senderName}</span>
                  <span className="text-[8px] px-1 py-0.2 rounded bg-accent-500/10 text-accent-300">مشرف</span>
                </span>
              )}

              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm shadow-md space-y-1.5 relative group ${
                  msg.isOutgoing
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-slate-950 font-medium rounded-br-xs'
                    : isDark ? 'bg-[#222222] text-slate-100 border border-slate-800 rounded-bl-xs' : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                {/* Poll Card */}
                {msg.type === 'poll' && msg.poll ? (
                  <div className="min-w-[240px] max-w-[320px] space-y-3">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-fuchsia-500/15 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-fuchsia-500" /></div><div><div className="font-extrabold text-xs">{isAr ? 'استطلاع رأي' : 'Poll'}</div><div className="text-[10px] opacity-60">{msg.poll.multiple ? (isAr ? 'يمكن اختيار أكثر من إجابة' : 'Multiple answers') : (isAr ? 'إجابة واحدة' : 'Single answer')}</div></div></div>
                    <div className="font-bold text-sm leading-relaxed">{msg.poll.question}</div>
                    <div className="space-y-2">
                      {msg.poll.options.map((option, i) => {
                        const count = (msg.poll?.votes?.[i] || []).length;
                        const total = Object.values(msg.poll?.votes || {}).reduce((n, ids) => n + ids.length, 0);
                        const selected = (msg.poll?.votes?.[i] || []).includes('me');
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return <button key={i} type="button" onClick={() => votePoll(msg.id, i)} className={`w-full text-start rounded-xl border p-2.5 transition ${selected ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-current/10 hover:border-fuchsia-500/50'}`}><div className="flex items-center justify-between gap-2"><span className="font-semibold text-xs">{option}</span><span className="text-[10px] opacity-60">{pct}%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-fuchsia-400 transition-all" style={{ width: `${pct}%` }} /></div></button>;
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Location / Live Location Card */}
                {msg.type === 'location' && msg.location ? (
                  <a
                    href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group/loc"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        msg.location.isLive ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-slate-900/20 text-current'
                      }`}
                    >
                      {msg.location.isLive ? <Navigation2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{msg.text}</span>
                        {msg.location.isLive && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold shrink-0">
                            {isAr ? 'مباشر' : 'LIVE'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] opacity-70 font-mono-num block truncate group-hover/loc:underline">
                        {isAr ? 'فتح في خرائط جوجل' : 'Open in Google Maps'} · {msg.location.lat.toFixed(4)}, {msg.location.lng.toFixed(4)}
                      </span>
                    </div>
                  </a>
                ) : /* Voice Message Simulation */
                msg.type === 'voice' ? (
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
                ) : msg.type === 'image' && msg.mediaUrl ? (
                  <div className="space-y-2">
                    <img src={msg.mediaUrl} alt={msg.text} className="max-w-full max-h-72 rounded-xl object-contain border border-current/10" />
                    <div className="text-[11px] font-semibold">{msg.text}</div>
                  </div>
                ) : msg.type === 'video' && msg.mediaUrl ? (
                  <div className="space-y-2">
                    <video src={msg.mediaUrl} controls playsInline className="max-w-full max-h-72 rounded-xl border border-current/10" />
                    <div className="text-[11px] font-semibold">{msg.text}</div>
                  </div>
                ) : msg.type === 'file' && msg.mediaUrl ? (
                  <a href={msg.mediaUrl} download={msg.text.replace(/^📄\s*/, '')} className="flex items-center gap-3 p-2 rounded-xl bg-black/10 hover:bg-black/20">
                    <FileText className="w-8 h-8 text-accent-500 shrink-0" />
                    <span className="text-xs font-bold break-all">{msg.text}</span>
                  </a>
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
          <div className={`p-4 ${chatPanel} border-t ${chatBorder} flex items-center justify-between gap-4 animate-fade-in`}>
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
                className="px-4 py-2 rounded-xl bg-accent-500 text-slate-950 text-xs font-extrabold shadow-md hover:bg-accent-400"
              >
                {isAr ? 'إرسال الصوت' : 'Send Voice'}
              </button>
            </div>
          </div>
        ) : (
          <>
          {liveLocationMsgId && (
            <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-400 text-[11px] font-bold">
                <Navigation2 className="w-3.5 h-3.5 animate-pulse" />
                <span>{isAr ? 'جاري مشاركة موقعك المباشر...' : 'Sharing your live location...'}</span>
              </div>
              <button
                type="button"
                onClick={handleStopLiveLocation}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline"
              >
                {isAr ? 'إيقاف' : 'Stop'}
              </button>
            </div>
          )}
          <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileAttachment(f, f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : 'file'); e.currentTarget.value = ''; }} />
          <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileAttachment(f, 'file'); e.currentTarget.value = ''; }} />
          <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCameraCapture(f); e.currentTarget.value = ''; }} />
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className={`p-3 md:pe-64 ${chatPanel} border-t ${chatBorder} flex items-center gap-2.5`}
          >
            <div className="relative">
              {showAttachMenu && (
                <div
                  className={`absolute bottom-full start-0 mb-2 w-56 rounded-2xl border border-accent-500/30 ${isDark ? 'bg-[#1c1c1c]' : 'bg-white'} shadow-2xl p-2 z-20 animate-fade-in space-y-1`}
                  id="chat-attach-menu"
                >
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                  >
                    <Image className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'صورة أو فيديو' : 'Photo / Video'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => documentInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'مستند' : 'Document'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setShowContactsModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'جهة اتصال' : 'Contact'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPollModal(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                  >
                    <Vote className="w-4 h-4 text-fuchsia-500" />
                    <span>{isAr ? 'استطلاع رأي' : 'Poll'}</span>
                  </button>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                  <button
                    type="button"
                    id="attach-share-location-btn"
                    onClick={handleShareLocation}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-accent-500" />
                    <span>{isAr ? 'الموقع' : 'Location'}</span>
                  </button>
                  <button
                    type="button"
                    id="attach-share-live-location-btn"
                    onClick={liveLocationMsgId ? handleStopLiveLocation : handleStartLiveLocation}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      liveLocationMsgId ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Navigation2 className={`w-4 h-4 ${liveLocationMsgId ? 'text-rose-400' : 'text-accent-500'}`} />
                    <span>
                      {liveLocationMsgId
                        ? (isAr ? 'إيقاف الموقع المباشر' : 'Stop live location')
                        : (isAr ? 'الموقع المباشر' : 'Live location')}
                    </span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowAttachMenu((v) => !v)}
                className={`p-2.5 rounded-xl hover:bg-slate-800 transition-colors ${
                  showAttachMenu ? 'text-accent-500 bg-slate-800' : 'text-slate-400 hover:text-accent-500'
                }`}
                title={isAr ? 'إرفاق ملف' : 'Attach'}
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-accent-500 transition-colors"
              title={isAr ? 'صورة' : 'Image'}
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isAr ? 'اكتب رسالتك المشفرة هنا...' : 'Type your encrypted message...'}
              className={`flex-1 px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-accent-500/60 ${chatInput}`}
            />

            {inputText.trim() ? (
              <button
                type="submit"
                className="p-3 bg-accent-500 hover:bg-accent-400 text-slate-950 rounded-xl shadow-md transition-transform active:scale-95"
                title={isAr ? 'إرسال' : 'Send'}
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceRecording}
                className={`p-3 ${chatIconButton} text-accent-500 rounded-xl shadow-md transition-transform active:scale-95`}
                title={isAr ? 'تسجيل رسالة صوتية' : 'Record voice note'}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
          </>
        )}
      </div>

      {activeCall && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl overflow-hidden border border-accent-500/30 shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeCall === 'video' ? (isAr ? 'مكالمة فيديو' : 'Video Call') : (isAr ? 'مكالمة صوتية' : 'Voice Call')}</div>
                <div className="text-[10px] text-emerald-500 font-bold">{isAr ? 'اتصال آمن • جاري الاتصال' : 'Secure call • Connecting'}</div>
              </div>
              <button onClick={endCall} className="p-2 rounded-xl bg-rose-500/10 text-rose-500"><X className="w-4 h-4" /></button>
            </div>
            {activeCall === 'video' ? (
              <div className="aspect-video bg-black relative flex items-center justify-center">
                {cameraStream ? <video ref={videoRef} muted playsInline className="w-full h-full object-cover" /> : <Camera className="w-12 h-12 text-slate-500" />}
                <div className="absolute bottom-3 start-3 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px]">{cameraStream ? (isAr ? 'الكاميرا مفعلة' : 'Camera enabled') : (isAr ? 'بانتظار إذن الكاميرا' : 'Waiting for camera permission')}</div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-accent-500/15 border border-accent-500/30 flex items-center justify-center text-accent-500"><Phone className="w-9 h-9" /></div>
                <div className={`mt-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeRoom.title || activeRoom.name}</div>
                <div className="mt-1 text-xs text-slate-500">{isAr ? 'جاري بدء الاتصال الصوتي…' : 'Starting voice call…'}</div>
              </div>
            )}
            <div className="p-4 flex justify-center">
              <button onClick={endCall} className="px-6 py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs">{isAr ? 'إنهاء المكالمة' : 'End Call'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Room */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} border border-accent-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-500/20 text-accent-500 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent-500/60"
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
                          ? 'bg-accent-500 text-slate-950 border-accent-500 shadow-sm'
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
                        newRoomAvatar === av.url ? 'border-accent-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-12 h-12 object-cover" />
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <img src={newRoomAvatar} alt="" className="w-14 h-14 rounded-2xl object-cover border border-accent-500/30" />
                  <button type="button" onClick={() => newRoomAvatarInputRef.current?.click()} className="flex-1 p-3 rounded-2xl border-2 border-dashed border-slate-700 hover:border-accent-500 text-start"><FileImage className="w-5 h-5 text-accent-500 mb-1" /><b className="text-xs block text-slate-200">{isAr ? 'اختيار صورة من الجهاز' : 'Choose image from device'}</b><span className="text-[10px] text-slate-500">{isAr ? 'حتى 3 ميجابايت' : 'Up to 3 MB'}</span></button>
                  <input ref={newRoomAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleNewRoomAvatarFile(e.target.files?.[0])} />
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
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-accent-500 hover:bg-accent-400 text-slate-950 shadow-md"
                >
                  {isAr ? 'إنشاء الغرفة الآن' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Professional Room Settings */}
      {showRoomInfoModal && (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className={`w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-[28px] border shadow-2xl ${isDark ? 'bg-[#111318] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <img src={activeRoom.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                <div className="min-w-0">
                  <h2 className="font-black text-base truncate">{isAr ? 'إعدادات الغرفة' : 'Room Settings'}</h2>
                  <p className="text-[11px] text-slate-500 truncate">{activeRoom.title || activeRoom.name} · {roomMembers.length} {isAr ? 'أعضاء' : 'members'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowRoomInfoModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex min-h-0 max-h-[calc(92vh-130px)]">
              <div className="w-[138px] sm:w-[170px] shrink-0 border-e border-slate-200 dark:border-slate-800 p-2 space-y-0.5 overflow-y-auto">
                {[
                  ['overview', Info, isAr ? 'نظرة عامة' : 'Overview'],
                  ['appearance', Palette, isAr ? 'المظهر والخلفية' : 'Appearance'],
                  ['chat', MessageSquare, isAr ? 'إعدادات الدردشة' : 'Chat settings'],
                  ['permissions', ShieldCheck, isAr ? 'الصلاحيات' : 'Permissions'],
                  ['members', Users, isAr ? 'الأعضاء والمشرفون' : 'Members & roles'],
                ].map(([id, Icon, label]) => (
                  <button key={String(id)} type="button" onClick={() => setRoomSettingsTab(id as any)} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition ${roomSettingsTab === id ? 'bg-accent-500/15 text-accent-500' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    {React.createElement(Icon as any, { className: 'w-3.5 h-3.5 shrink-0' })}<span className="truncate">{label as string}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {roomSettingsTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="relative shrink-0">
                        <img src={activeRoom.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-accent-500/30" alt="" />
                        <button type="button" onClick={() => roomAvatarInputRef.current?.click()} className="absolute -bottom-2 -end-2 p-2 rounded-full bg-accent-500 text-slate-950 shadow-lg" title={isAr ? 'تغيير صورة الغرفة' : 'Change room icon'}><Camera className="w-4 h-4" /></button>
                        <input ref={roomAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleRoomAvatarFile(e.target.files?.[0])} />
                      </div>
                      <div className="min-w-0">
                        <b className="text-xs block">{isAr ? 'صورة / أيقونة الغرفة' : 'Room photo / icon'}</b>
                        <span className="text-[10px] text-slate-500">{isAr ? 'اختيار صورة من الجهاز لتظهر في رأس الغرفة وقائمة المحادثات.' : 'Choose a device image for the room header and chat list.'}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl p-4 bg-gradient-to-br from-accent-500/10 to-transparent border border-accent-500/20">
                      <div className="flex items-center gap-3 mb-3"><ShieldCheck className="w-5 h-5 text-accent-500" /><div><div className="font-black text-sm">{isAr ? 'إدارة احترافية للغرفة' : 'Professional room management'}</div><div className="text-[10px] text-slate-500">{isAr ? 'تحكم كامل في الهوية والأمان والأعضاء والصلاحيات.' : 'Full control over identity, security, members and permissions.'}</div></div></div>
                      <div className="grid sm:grid-cols-3 gap-2 text-[10px]">
                        <div className="p-3 rounded-xl bg-white/5 border border-slate-200 dark:border-slate-700"><b>{roomMembers.length}</b><div className="text-slate-500">{isAr ? 'أعضاء' : 'Members'}</div></div>
                        <div className="p-3 rounded-xl bg-white/5 border border-slate-200 dark:border-slate-700"><b>{roomMembers.filter(m => m.role === 'admin' || m.role === 'owner').length}</b><div className="text-slate-500">{isAr ? 'إدارة' : 'Admins'}</div></div>
                        <div className="p-3 rounded-xl bg-white/5 border border-slate-200 dark:border-slate-700"><b>{roomMembers.filter(m => m.role === 'moderator').length}</b><div className="text-slate-500">{isAr ? 'مشرفون' : 'Moderators'}</div></div>
                      </div>
                    </div>
                    <label className="block"><span className="text-xs font-bold">{isAr ? 'وصف الغرفة' : 'Room description'}</span><textarea value={roomDescription} onChange={e => setRoomDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent p-3 text-xs outline-none focus:border-accent-500" placeholder={isAr ? 'اكتب وصفاً واضحاً للغرفة...' : 'Describe this room...'} /></label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <button type="button" onClick={() => persistRoomConfig({ pinned: !activeRoom.pinned })} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-start hover:border-accent-500"><Pin className="w-4 h-4 text-accent-500 mb-2" /><b className="text-xs block">{isAr ? 'تثبيت الغرفة' : 'Pin room'}</b><span className="text-[10px] text-slate-500">{activeRoom.pinned ? (isAr ? 'مثبتة حالياً' : 'Currently pinned') : (isAr ? 'إظهارها أعلى القائمة' : 'Keep it at the top')}</span></button>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(activeRoom.inviteLink || `smarttime://room/${activeRoom.id}`)} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-start hover:border-accent-500"><Link className="w-4 h-4 text-accent-500 mb-2" /><b className="text-xs block">{isAr ? 'رابط الدعوة' : 'Invite link'}</b><span className="text-[10px] text-slate-500">{isAr ? 'نسخ رابط دعوة الغرفة' : 'Copy room invite link'}</span></button>
                      <button type="button" onClick={() => { setRoomDescription(''); setRoomPrefs({ disappearing:'off', muted:false, readReceipts:true, typingIndicator:true, linkPreviews:true, mediaAutoSave:false, enterToSend:true, slowModeSeconds:0, approvalRequired:false }); setDisappearingMessages('off'); setIsMuted(false); setChatBackground(''); }} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-start hover:border-red-400"><SlidersHorizontal className="w-4 h-4 text-slate-500 mb-2" /><b className="text-xs block">{isAr ? 'إعادة ضبط إعدادات الغرفة' : 'Reset room settings'}</b><span className="text-[10px] text-slate-500">{isAr ? 'إرجاع تفضيلات الدردشة إلى الوضع الافتراضي' : 'Restore chat preferences to defaults'}</span></button>
                    </div>
                  </div>
                )}

                {roomSettingsTab === 'appearance' && (
                  <div className="space-y-5">
                    <div><div className="font-black text-sm mb-1">{isAr ? 'خلفيات المحادثة' : 'Chat wallpapers'}</div><div className="text-[10px] text-slate-500 mb-3">{isAr ? 'اختر من مجموعة أكبر، أو ارفع صورة من جهازك.' : 'Choose from a larger gallery or upload your own image.'}</div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {[
                          ['سادة فاتح','linear-gradient(135deg,#ffffff,#e2e8f0)'],['رمادي ناعم','linear-gradient(135deg,#cbd5e1,#f8fafc)'],['ذهبي','linear-gradient(135deg,#fff3b0,#f5c542)'],['أزرق','linear-gradient(135deg,#dbeafe,#2563eb)'],['بنفسجي','linear-gradient(135deg,#ede9fe,#7c3aed)'],
                          ['وردي','linear-gradient(135deg,#fce7f3,#ec4899)'],['أخضر','linear-gradient(135deg,#dcfce7,#16a34a)'],['ليلي','linear-gradient(135deg,#020617,#1e293b)'],['نيون','linear-gradient(135deg,#0f172a,#7c3aed,#06b6d4)'],['فحم','linear-gradient(135deg,#09090b,#27272a)'],
                          ['نقاط','radial-gradient(circle at 2px 2px,#94a3b8 1px,transparent 1px) 0 0/14px 14px'],['شبكة','linear-gradient(#94a3b8 1px,transparent 1px),linear-gradient(90deg,#94a3b8 1px,transparent 1px) 0 0/18px 18px'],['موجات','repeating-radial-gradient(circle at 0 0,#e2e8f0 0 2px,transparent 3px 14px)'],['قطري','repeating-linear-gradient(135deg,#e2e8f0 0 8px,#f8fafc 8px 16px)'],['شفاف داكن','linear-gradient(135deg,rgba(15,23,42,.94),rgba(30,41,59,.78))']
                        ].map(([label,bg]) => <button key={label} type="button" title={label} onClick={() => updateRoomBackground(bg)} className="h-16 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-accent-500" style={{backgroundImage:bg}}><span className="sr-only">{label}</span></button>)}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <button type="button" onClick={() => roomBackgroundInputRef.current?.click()} className="p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-accent-500 text-start"><Image className="w-5 h-5 text-accent-500 mb-2" /><b className="text-xs block">{isAr ? 'رفع خلفية من الجهاز' : 'Upload wallpaper'}</b><span className="text-[10px] text-slate-500">{isAr ? 'حتى 3 ميجابايت' : 'Up to 3 MB'}</span></button>
                      <button type="button" onClick={() => { updateRoomBackground(''); persistRoomConfig({ backgroundUrl: '' }); }} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-start hover:border-accent-500"><Trash2 className="w-5 h-5 text-slate-400 mb-2" /><b className="text-xs block">{isAr ? 'إزالة الخلفية' : 'Reset wallpaper'}</b><span className="text-[10px] text-slate-500">{isAr ? 'العودة للخلفية الافتراضية' : 'Return to default'}</span></button>
                    </div>
                    <input ref={roomBackgroundInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleRoomBackgroundFile(e.target.files?.[0])} />
                  </div>
                )}

                {roomSettingsTab === 'chat' && (
                  <div className="space-y-2">
                    {[
                      ['readReceipts', CheckCheck, isAr ? 'إيصالات القراءة' : 'Read receipts', isAr ? 'إظهار أن الرسالة تمت قراءتها' : 'Show when messages are read'],
                      ['typingIndicator', MessageSquare, isAr ? 'مؤشر الكتابة' : 'Typing indicator', isAr ? 'إظهار عندما يكتب عضو' : 'Show when someone is typing'],
                      ['linkPreviews', Link, isAr ? 'معاينة الروابط' : 'Link previews', isAr ? 'عرض معاينات الروابط تلقائياً' : 'Preview shared links'],
                      ['mediaAutoSave', Image, isAr ? 'حفظ الوسائط تلقائياً' : 'Auto-save media', isAr ? 'حفظ الصور والفيديوهات على الجهاز' : 'Save photos and videos automatically'],
                      ['enterToSend', Send, isAr ? 'Enter للإرسال' : 'Enter to send', isAr ? 'زر Enter يرسل الرسالة' : 'Press Enter to send'],
                    ].map(([key, Icon, title, desc]) => {
                      const prefKey = key as keyof ChatRoomSettings;
                      const enabled = roomPrefEnabled(prefKey);
                      const IconComponent = Icon as React.ElementType;
                      return <button key={String(key)} type="button" onClick={() => toggleRoomPref(prefKey)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-start"><div className="flex gap-3"><IconComponent className="w-4 h-4 text-accent-500 mt-0.5" /><div><b className="text-xs block">{String(title)}</b><span className="text-[10px] text-slate-500">{String(desc)}</span></div></div><span className={`w-10 h-5 rounded-full p-0.5 transition ${enabled ? 'bg-accent-500' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`block w-4 h-4 rounded-full bg-white transition ${enabled ? 'translate-x-5' : ''}`} /></span></button>;
                    })}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700"><div className="font-bold text-xs mb-2">{isAr ? 'الرسائل المختفية' : 'Disappearing messages'}</div><div className="flex flex-wrap gap-2">{([['off','إيقاف'],['24h','24 ساعة'],['7d','7 أيام'],['90d','90 يوم'] ] as const).map(([v,l]) => <button key={v} type="button" onClick={() => setDisappearingMessages(v)} className={`px-3 py-2 rounded-xl text-[10px] font-bold ${disappearingMessages === v ? 'bg-accent-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800'}`}>{isAr ? l : v}</button>)}</div></div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700"><div className="font-bold text-xs mb-2">{isAr ? 'الوضع البطيء' : 'Slow mode'}</div><select value={roomPrefs.slowModeSeconds} onChange={e => setRoomPrefs(p => ({...p, slowModeSeconds: Number(e.target.value) as any}))} className="w-full rounded-xl bg-transparent border border-slate-200 dark:border-slate-700 p-2 text-xs"><option value={0}>Off</option><option value={10}>10 sec</option><option value={30}>30 sec</option><option value={60}>60 sec</option><option value={300}>5 min</option></select></div>
                    <button type="button" onClick={() => setIsMuted(!isMuted)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700"><span className="flex gap-3"><BellOff className="w-4 h-4 text-accent-500" /><span><b className="text-xs block">{isAr ? 'كتم إشعارات الغرفة' : 'Mute room notifications'}</b><span className="text-[10px] text-slate-500">{isAr ? 'إيقاف التنبيهات لهذه الغرفة' : 'Pause notifications for this room'}</span></span></span><span className={`w-10 h-5 rounded-full p-0.5 ${isMuted ? 'bg-accent-500' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`block w-4 h-4 rounded-full bg-white ${isMuted ? 'translate-x-5' : ''}`} /></span></button>
                  </div>
                )}

                {roomSettingsTab === 'permissions' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-3">
                      <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-accent-500" /><div><b className="text-xs">{isAr ? 'إدارة المشرفين' : 'Administrator controls'}</b><p className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'منشئ الغرفة هو المسؤول عن تعيين المديرين والمشرفين وتغيير أدوارهم.' : 'The room creator controls who becomes an admin or moderator.'}</p></div></div>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-[10px] text-slate-500">{isRoomOwner ? (isAr ? 'أنت منشئ الغرفة ويمكنك إدارة الأدوار.' : 'You are the room creator and can manage roles.') : (isAr ? 'تعيين الأدوار متاح لمنشئ الغرفة فقط.' : 'Role assignment is available to the room creator only.')}</span>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${isRoomOwner ? 'bg-accent-500/15 text-accent-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>{isRoomOwner ? (isAr ? 'مالك' : 'OWNER') : (isAr ? 'عضو' : 'MEMBER')}</span>
                    </div>
                    <div className="space-y-1">
                      {roomMembers.filter(m => m.role !== 'owner').map(m => (
                        <div key={m.id} className="flex items-center gap-2.5 py-2 border-b border-slate-100 dark:border-slate-800/70 last:border-0">
                          <img src={m.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                          <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold truncate">{m.name}</div><div className="text-[9px] text-slate-500">{m.role === 'admin' ? (isAr ? 'مدير' : 'Admin') : m.role === 'moderator' ? (isAr ? 'مشرف' : 'Moderator') : (isAr ? 'عضو' : 'Member')}</div></div>
                          <select disabled={!isRoomOwner} value={m.role} onChange={e => changeMemberRole(m.id, e.target.value as ChatMember['role'])} className="rounded-lg bg-transparent border border-slate-200 dark:border-slate-700 px-2 py-1 text-[9px]">
                            <option value="member">{isAr ? 'عضو' : 'Member'}</option><option value="moderator">{isAr ? 'مشرف' : 'Moderator'}</option><option value="admin">{isAr ? 'مدير' : 'Admin'}</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <div className="text-[10px] font-bold mb-2">{isAr ? 'صلاحيات الدور المحدد' : 'Role permissions'}</div>
                      <div className="flex gap-1.5 mb-2">{([['admin', isAr ? 'مدير' : 'Admin'], ['moderator', isAr ? 'مشرف' : 'Moderator'], ['member', isAr ? 'عضو' : 'Member']] as const).map(([role,label]) => <button key={role} type="button" onClick={() => setPermissionRole(role)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold ${permissionRole === role ? 'bg-accent-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{label}</button>)}</div>
                      <div className="space-y-0">
                        {[['sendMessages','إرسال الرسائل','Send messages'],['sendMedia','إرسال الصور والملفات','Send media & files'],['addMembers','إضافة أعضاء','Add members'],['pinMessages','تثبيت الرسائل','Pin messages'],['editRoom','تعديل معلومات الغرفة','Edit room info'],['deleteMessages','حذف الرسائل','Delete messages'],['startCalls','بدء المكالمات','Start calls'],['mentionEveryone','منشن الجميع @all','Mention everyone @all']].map(([key, ar, en]) => { const permissionKey = key as keyof ChatRoomPermissions; const enabled = roomPermissionEnabled(permissionKey); return <button key={key} type="button" disabled={!isRoomOwner} onClick={() => toggleRoomPermission(permissionKey)} className="w-full flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/70 last:border-0 disabled:opacity-60"><span className="text-[10px] font-medium">{isAr ? ar : en}</span><span className={`w-8 h-4 rounded-full p-0.5 ${enabled ? 'bg-accent-500' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`block w-3 h-3 rounded-full bg-white transition ${enabled ? 'translate-x-4' : ''}`} /></span></button>; })}
                      </div>
                    </div>
                  </div>
                )}

                {roomSettingsTab === 'members' && (() => {
                  const availableMembers = rooms
                    .filter(r => r.id !== activeRoomId)
                    .map(r => ({ id: r.id, name: r.title || r.name || 'User', avatar: r.avatar, role: 'member' as const }))
                    .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
                  const visibleMembers = roomMembers.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
                  const selectedMember = roomMembers.find(m => m.id === longPressMemberId);
                  return (
                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-500">
                        {isRoomOwner ? (isAr ? 'اضغط ضغطة مطولة على أي عضو لفتح قائمة الإدارة وتعيين دوره. لا يوجد حد ثابت لعدد الأعضاء.' : 'Long-press any member to open management actions. There is no fixed member limit.') : (isAr ? 'منشئ الغرفة وحده يملك إدارة الأعضاء والأدوار.' : 'Only the room creator can manage members and roles.')}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent py-2 ps-9 pe-3 text-xs" placeholder={isAr ? 'بحث في الأعضاء...' : 'Search members...'} />
                        </div>
                        <button type="button" disabled={!isRoomOwner} onClick={() => { setSelectedMemberIds([]); setShowAddMembers(true); }} className="px-3 rounded-xl bg-accent-500 text-slate-950 font-black text-[10px] disabled:opacity-50">
                          {isAr ? 'إضافة أعضاء' : 'Add members'}
                        </button>
                      </div>

                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {visibleMembers.map(m => (
                          <div key={m.id}
                            className="relative flex items-center gap-3 px-3 py-2.5 select-none active:bg-accent-500/10"
                            onPointerDown={(e) => startMemberLongPress(m.id, e)}
                            onPointerUp={cancelMemberLongPress}
                            onPointerCancel={cancelMemberLongPress}
                            onPointerLeave={cancelMemberLongPress}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (isRoomOwner) {
                                const menuWidth = 192, menuHeight = 220, gap = 6;
                                let left = e.clientX - menuWidth / 2;
                                let top = e.clientY + gap;
                                if (left < 8) left = 8;
                                if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
                                if (top + menuHeight > window.innerHeight - 8) top = Math.max(8, e.clientY - menuHeight - gap);
                                setMemberMenuPosition({ top, left });
                                setLongPressMemberId(m.id);
                              }
                            }}
                          >
                            <img src={m.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs truncate">{m.name}</div>
                              <div className="text-[10px] text-slate-500">{m.role === 'owner' ? (isAr ? 'مالك الغرفة' : 'Owner') : m.role === 'admin' ? (isAr ? 'مدير' : 'Admin') : m.role === 'moderator' ? (isAr ? 'مشرف' : 'Moderator') : (isAr ? 'عضو' : 'Member')}</div>
                            </div>
                            {m.role === 'owner' && <span className="text-[9px] text-accent-500 font-bold">{isAr ? 'المنشئ' : 'Creator'}</span>}

                            {longPressMemberId === m.id && isRoomOwner && m.role !== 'owner' && memberMenuPosition && (
                              <div
                                className={`fixed z-[9999] w-48 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden ${isDark ? 'bg-[#17191d]' : 'bg-white'}`}
                                style={{ top: memberMenuPosition.top, left: memberMenuPosition.left }}
                                onPointerDown={e => e.stopPropagation()}
                                onClick={e => e.stopPropagation()}
                              >
                                <button type="button" className="w-full px-3 py-2.5 text-start text-[10px] hover:bg-accent-500/10" onClick={() => { changeMemberRole(m.id, 'admin'); closeMemberMenu(); }}>
                                  {isAr ? 'تعيين كمدير' : 'Make admin'}
                                </button>
                                <button type="button" className="w-full px-3 py-2.5 text-start text-[10px] hover:bg-accent-500/10" onClick={() => { changeMemberRole(m.id, 'moderator'); closeMemberMenu(); }}>
                                  {isAr ? 'تعيين كمشرف' : 'Make moderator'}
                                </button>
                                <button type="button" className="w-full px-3 py-2.5 text-start text-[10px] hover:bg-accent-500/10" onClick={() => { changeMemberRole(m.id, 'member'); closeMemberMenu(); }}>
                                  {isAr ? 'إرجاع لعضو' : 'Make member'}
                                </button>
                                <button type="button" className="w-full px-3 py-2.5 text-start text-[10px] hover:bg-orange-500/10 text-orange-500" onClick={() => { setRoomMembers(prev => prev.map(x => x.id === m.id ? {...x, banned:true} : x)); closeMemberMenu(); }}>
                                  {isAr ? 'حظر العضو' : 'Ban member'}
                                </button>
                                <button type="button" className="w-full px-3 py-2.5 text-start text-[10px] hover:bg-red-500/10 text-red-500" onClick={() => { removeRoomMember(m.id); closeMemberMenu(); }}>
                                  {isAr ? 'إزالة العضو' : 'Remove member'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {!visibleMembers.length && <div className="p-5 text-center text-[10px] text-slate-500">{isAr ? 'لا يوجد أعضاء مطابقون.' : 'No matching members.'}</div>}
                      </div>

                      {showAddMembers && isRoomOwner && (
                        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3" onMouseDown={() => setShowAddMembers(false)}>
                          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-4 ${isDark ? 'bg-[#15171b] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`} onMouseDown={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-3">
                              <div><b className="text-sm">{isAr ? 'إضافة أعضاء' : 'Add members'}</b><div className="text-[10px] text-slate-500">{isAr ? 'يمكنك تحديد أي عدد متاح بدون حد ثابت.' : 'Select any number available; there is no fixed limit.'}</div></div>
                              <button type="button" onClick={() => setShowAddMembers(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                              {availableMembers.map(m => {
                                const already = roomMembers.some(x => x.id === m.id);
                                const checked = selectedMemberIds.includes(m.id);
                                return <label key={m.id} className={`flex items-center gap-3 py-2.5 cursor-pointer ${already ? 'opacity-40' : ''}`}>
                                  <input type="checkbox" disabled={already} checked={checked || already} onChange={() => setSelectedMemberIds(prev => checked ? prev.filter(id => id !== m.id) : [...prev, m.id])} />
                                  <img src={m.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                                  <span className="text-xs font-bold flex-1">{m.name}</span>
                                  {already && <span className="text-[9px] text-slate-500">{isAr ? 'مضاف' : 'Added'}</span>}
                                </label>;
                              })}
                            </div>
                            <button type="button" onClick={() => { availableMembers.filter(m => selectedMemberIds.includes(m.id)).forEach(m => addRoomMember(m)); setSelectedMemberIds([]); setShowAddMembers(false); }} className="w-full mt-3 py-2.5 rounded-xl bg-accent-500 text-slate-950 text-xs font-black">{isAr ? 'إضافة المحددين' : 'Add selected'}</button>
                          </div>
                        </div>
                      )}

                      <input ref={memberAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleMemberAvatarFile(e.target.files?.[0])} />
                      <div className="text-[9px] text-slate-500 px-1">{isAr ? 'لا تظهر أرقام الهاتف للأعضاء. تعيين الأدوار متاح لمنشئ الغرفة فقط.' : 'Phone numbers stay hidden. Role assignment is available only to the room creator.'}</div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3"><span className="text-[10px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500" />{isAr ? 'التغييرات تُحفظ محلياً في هذه المرحلة' : 'Changes are saved locally in this stage'}</span><div className="flex gap-2"><button type="button" onClick={() => setShowRoomInfoModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800">{isAr ? 'إلغاء' : 'Cancel'}</button><button type="button" onClick={saveRoomSettings} className="px-5 py-2 rounded-xl bg-accent-500 text-slate-950 font-black text-xs">{isAr ? 'حفظ التغييرات' : 'Save changes'}</button></div></div>
          </div>
        </div>
      )}

      {showPollModal && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={() => setShowPollModal(false)}>
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-5 ${isDark ? 'bg-[#17191d] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`} onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 flex items-center justify-center"><Vote className="w-4 h-4 text-fuchsia-500"/></div><div><h3 className="font-black text-sm">{isAr ? 'استطلاع رأي جديد' : 'New poll'}</h3><p className="text-[10px] text-slate-500">{isAr ? 'شارك المجموعة سؤالاً واجعل التصويت تفاعلياً.' : 'Ask the group and collect interactive votes.'}</p></div></div><button type="button" onClick={() => setShowPollModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4"/></button></div>
            <label className="block text-[10px] font-bold mb-1.5">{isAr ? 'السؤال' : 'Question'}</label>
            <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder={isAr ? 'مثلاً: ما رأيك في التصميم الجديد؟' : 'e.g. What do you think of the new design?'} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs mb-3" />
            <div className="flex items-center justify-between mb-1.5"><label className="text-[10px] font-bold">{isAr ? 'الاختيارات' : 'Options'}</label><button type="button" onClick={() => setPollOptions(v => [...v, ''])} className="text-[10px] text-fuchsia-500 font-bold">+ {isAr ? 'إضافة اختيار' : 'Add option'}</button></div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pollOptions.map((option, i) => <div key={i} className="flex gap-2"><input value={option} onChange={e => setPollOptions(v => v.map((x, idx) => idx === i ? e.target.value : x))} placeholder={`${isAr ? 'اختيار' : 'Option'} ${i + 1}`} className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs" />{pollOptions.length > 2 && <button type="button" onClick={() => setPollOptions(v => v.filter((_, idx) => idx !== i))} className="p-2 text-rose-500"><X className="w-4 h-4"/></button>}</div>)}
            </div>
            <label className="flex items-center gap-2 mt-3 text-[10px] font-semibold cursor-pointer"><input type="checkbox" checked={pollMultiple} onChange={e => setPollMultiple(e.target.checked)} className="accent-fuchsia-500"/>{isAr ? 'السماح باختيار أكثر من إجابة' : 'Allow multiple answers'}</label>
            <button type="button" onClick={createPoll} className="w-full mt-4 py-2.5 rounded-xl bg-fuchsia-500 text-white font-black text-xs hover:bg-fuchsia-600 transition">{isAr ? 'إنشاء الاستطلاع وإرساله' : 'Create & send poll'}</button>
          </div>
        </div>
      )}

      {showContactsModal && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border border-accent-500/30 shadow-2xl p-5 ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-accent-500" /><h3 className="font-black text-sm">{isAr ? 'جهة اتصال' : 'Contact'}</h3></div>
              <button type="button" onClick={() => setShowContactsModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 mb-2">{isAr ? 'اختر جهة اتصال من جهات SMART TIME الحالية لإرسالها في المحادثة.' : 'Choose a SMART TIME contact to share in this chat.'}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rooms.filter((r) => r.id !== activeRoomId).map((r) => (
                <button key={r.id} type="button" onClick={() => { handleSendMessage(undefined, isAr ? `👤 جهة اتصال: ${r.title || r.name}` : `👤 Contact: ${r.title || r.name}`, 'text'); setShowContactsModal(false); }} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-accent-500/50 transition-all text-start">
                  <img src={r.avatar} alt={r.title || r.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0"><div className="font-bold text-xs truncate">{r.title || r.name}</div><div className="text-[10px] text-slate-500">{r.type === 'group' ? (isAr ? 'مجموعة' : 'Group') : r.type === 'public' ? (isAr ? 'قناة' : 'Channel') : (isAr ? 'محادثة خاصة' : 'Private chat')}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
