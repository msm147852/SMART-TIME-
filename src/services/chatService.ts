import { ChatRoom, ChatMessage, ChatMember, SavedMessageItem } from '../types';
import { getStoredSession, authHeaders } from './authService';
import { apiUrl, wsUrl } from './apiConfig';

type ChatEventListener = (payload: any) => void;

class ChatService {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<ChatEventListener>>();
  private activeRoomId: string | null = null;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private isConnecting = false;

  constructor() {
    this.initWebSocket();
  }

  // Event subscription
  on(event: string, listener: ChatEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: ChatEventListener) {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, payload: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error(`Error in chat event listener for ${event}:`, e);
        }
      });
    }
  }

  // WebSocket Connection
  initWebSocket() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const fullWsUrl = wsUrl('/ws/chat');

      this.ws = new WebSocket(fullWsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.emit('connection_status', { isConnected: true });

        // Authenticate with token
        const session = getStoredSession();
        if (session?.token) {
          this.sendWs('auth', { token: session.token });
        }

        // Re-join active room if any
        if (this.activeRoomId) {
          this.sendWs('join_room', { roomId: this.activeRoomId });
        }

        // Heartbeat ping
        clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          if (type) {
            this.emit(type, payload);
          }
        } catch (e) {
          console.warn('Chat WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.emit('connection_status', { isConnected: false });
        clearInterval(this.pingTimer);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.emit('connection_status', { isConnected: false });
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.initWebSocket();
    }, 4000);
  }

  private sendWs(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  // Active room tracking
  joinRoom(roomId: string) {
    this.activeRoomId = roomId;
    this.sendWs('join_room', { roomId });
  }

  leaveRoom(roomId: string) {
    if (this.activeRoomId === roomId) {
      this.activeRoomId = null;
    }
    this.sendWs('leave_room', { roomId });
  }

  sendTyping(roomId: string, isTyping: boolean) {
    this.sendWs('typing', { roomId, isTyping });
  }

  authenticateSocket() {
    const session = getStoredSession();
    if (session?.token) {
      this.sendWs('auth', { token: session.token });
    }
  }

  // API helper
  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers as any || {}),
    };

    const res = await fetch(apiUrl(path), { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'حدث خطأ في خدمة المحادثة');
    }
    return data;
  }

  // REST API Methods

  // 1. Get all rooms
  async getRooms(archived = false): Promise<ChatRoom[]> {
    const data = await this.request(`/api/chat/rooms?archived=${archived ? 'true' : 'false'}`);
    return data.rooms || [];
  }

  // 2. Create room
  async createRoom(params: {
    title: string;
    description?: string;
    type?: 'direct' | 'group' | 'public' | 'voice' | 'video';
    roomType?: 'direct' | 'group' | 'public' | 'voice' | 'video';
    topic?: string;
    isVoice?: boolean;
    isVideo?: boolean;
    isLive?: boolean;
    avatar?: string;
    memberIds?: string[];
    background?: string;
    backgroundUrl?: string;
    settings?: any;
    permissions?: any;
    maxParticipants?: number;
  }): Promise<{ roomId: string; isExisting?: boolean }> {
    const data = await this.request('/api/chat/rooms', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data;
  }

  // 3. Get room details
  async getRoomDetails(roomId: string): Promise<ChatRoom> {
    const data = await this.request(`/api/chat/rooms/${roomId}`);
    return data.room;
  }

  // 4. Update room details & settings
  async updateRoom(roomId: string, params: Partial<ChatRoom>): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  // 5. Delete room
  async deleteRoom(roomId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}`, {
      method: 'DELETE',
    });
  }

  // 6. Leave room
  async leaveRoomApi(roomId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/leave`, {
      method: 'POST',
    });
  }

  async joinRoomApi(roomId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/join`, {
      method: 'POST',
    });
  }

  async inviteMember(roomId: string, userId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // 7. Clear room messages
  async clearRoomMessages(roomId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/clear`, {
      method: 'POST',
    });
  }

  // 8. Get messages
  async getMessages(roomId: string, limit = 50, before?: string, q?: string): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (before) params.set('before', before);
    if (q) params.set('q', q);

    const data = await this.request(`/api/chat/rooms/${roomId}/messages?${params.toString()}`);
    return data.messages || [];
  }

  // 9. Send message
  async sendMessage(roomId: string, payload: {
    text?: string;
    body?: string;
    type?: 'text' | 'image' | 'video' | 'voice' | 'file' | 'location' | 'poll';
    mediaUrl?: string;
    extra?: any;
    forwarded?: boolean;
    originalMessageId?: string;
    originalSender?: string;
  }): Promise<ChatMessage> {
    const data = await this.request(`/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.message;
  }

  // 10. Edit message
  async editMessage(roomId: string, messageId: string, text: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    });
  }

  // 11. Delete message
  async deleteMessage(roomId: string, messageId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // 12. Pin / Unpin message
  async pinMessage(roomId: string, messageId: string, isPinned?: boolean): Promise<{ isPinned: boolean }> {
    const data = await this.request(`/api/chat/rooms/${roomId}/messages/${messageId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ isPinned }),
    });
    return data;
  }

  // 13. Mark room as read
  async markRoomAsRead(roomId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/read`, {
      method: 'POST',
    });
  }

  // 14. Saved Messages
  async getSavedMessages(): Promise<SavedMessageItem[]> {
    const data = await this.request('/api/chat/saved-messages');
    return data.savedMessages || [];
  }

  async saveMessage(messageId: string): Promise<void> {
    await this.request(`/api/chat/saved-messages/${messageId}`, {
      method: 'POST',
    });
  }

  async unsaveMessage(messageId: string): Promise<void> {
    await this.request(`/api/chat/saved-messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // 15. Member management
  async addMember(roomId: string, userId: string, role = 'member'): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async banMember(roomId: string, userId: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/members/${userId}/ban`, {
      method: 'POST',
    });
  }

  async updateMemberRole(roomId: string, userId: string, role: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // 16. Get available users
  async getUsers(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    phone?: string;
    isOnline?: boolean;
    isCurrent?: boolean;
  }>> {
    const data = await this.request('/api/chat/users');
    return data.users || [];
  }

  // 17. Resolve selected phone numbers without exposing the users directory
  async resolveUsers(phones: string[]): Promise<Array<{
    id: string;
    name: string;
    avatar: string;
    phone?: string;
  }>> {
    const data = await this.request('/api/chat/users/resolve', {
      method: 'POST',
      body: JSON.stringify({ phones }),
    });
    return data.matches || [];
  }

  // 17. Match phone contacts to SMART TIME users
  async lookupContacts(phones: string[]): Promise<Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    phone?: string;
    isOnline?: boolean;
  }>> {
    const data = await this.request('/api/chat/contacts/lookup', {
      method: 'POST',
      body: JSON.stringify({ phones }),
    });
    return data.users || [];
  }

  // 18. Search messages across rooms
  async searchMessages(q: string): Promise<Array<{
    id: string;
    roomId: string;
    roomTitle: string;
    roomType: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    text: string;
    createdAt: string;
  }>> {
    const data = await this.request(`/api/chat/search?q=${encodeURIComponent(q)}`);
    return data.results || [];
  }

  async archiveRoom(roomId: string, archived: boolean): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/archive`, { method: 'PUT', body: JSON.stringify({ archived }) });
  }
  async blockUser(userId: string): Promise<void> { await this.request(`/api/chat/users/${userId}/block`, { method:'POST' }); }
  async unblockUser(userId: string): Promise<void> { await this.request(`/api/chat/users/${userId}/unblock`, { method:'POST' }); }
  async getBlockedUsers(): Promise<any[]> { const d=await this.request('/api/chat/users/blocked'); return d.users||[]; }
  async setAutoDelete(roomId: string, duration: number): Promise<void> { await this.request(`/api/chat/rooms/${roomId}/auto-delete`, {method:'PUT',body:JSON.stringify({duration})}); }
  async getRoomSettings(roomId: string): Promise<any> { const d=await this.request(`/api/chat/rooms/${roomId}/settings`); return d.settings||{}; }
  async updateRoomSettings(roomId: string, settings: any): Promise<any> { const d=await this.request(`/api/chat/rooms/${roomId}/settings`,{method:'PUT',body:JSON.stringify(settings)}); return d.settings||{}; }
  async forwardMessage(targetRoomId: string, message: ChatMessage): Promise<ChatMessage> {
    const data=await this.request(`/api/chat/rooms/${targetRoomId}/messages`,{method:'POST',body:JSON.stringify({text: message.text||message.body||'',body:message.text||message.body||'',type:message.type||'text',mediaUrl:message.mediaUrl,forwarded:true,originalMessageId:message.id,originalSender:message.senderName})});
    return data.message;
  }
  async getVoiceToken(roomId: string): Promise<any> { return this.request(`/api/chat/rooms/${roomId}/voice/token`); }
  async getLiveKitToken(roomId: string): Promise<{token:string;url:string}> { return this.request(`/api/chat/rooms/${roomId}/voice/token`); }

  async toggleReaction(roomId: string, messageId: string, reaction: string): Promise<{ active: boolean; reactions: Record<string, number> }> {
    const data = await this.request(`/api/chat/rooms/${roomId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ reaction }),
    });
    return { active: !!data.active, reactions: data.reactions || {} };
  }

  async getMessageReactions(roomId: string, messageId: string): Promise<Record<string, number>> {
    const data = await this.request(`/api/chat/rooms/${roomId}/messages/${messageId}/reactions`);
    return data.reactions || {};
  }
  async removeReaction(roomId: string, messageId: string, reaction: string): Promise<void> {
    await this.request(`/api/chat/rooms/${roomId}/messages/${messageId}/reactions?reaction=${encodeURIComponent(reaction)}`, { method:'DELETE' });
  }

  async getReactionDetails(roomId: string, messageId: string): Promise<{reactions:Record<string,number>;users:Array<{userId:string;name:string;reaction:string}>}> {
    return this.request(`/api/chat/rooms/${roomId}/messages/${messageId}/reactions`);
  }
  async getStories(): Promise<Array<{
    id: string;
    userId: string;
    name: string;
    avatar?: string;
    body?: string;
    mediaUrl?: string;
    expiresAt: string;
    createdAt: string;
  }>> {
    const data = await this.request('/api/chat/stories');
    return (data.stories || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      name: s.name || 'مستخدم',
      avatar: s.avatar || '',
      body: s.body || '',
      mediaUrl: s.media_url || '',
      expiresAt: s.expires_at,
      createdAt: s.created_at,
    }));
  }
  async voiceJoin(roomId: string, role: 'host'|'guest'|'listener' = 'guest') { return this.request(`/api/chat/rooms/${roomId}/voice/join`, { method:'POST', body: JSON.stringify({ role }) }); }
  async voiceLeave(roomId: string) { return this.request(`/api/chat/rooms/${roomId}/voice/leave`, { method:'POST' }); }
  async voiceMute(roomId: string, muted: boolean) { return this.request(`/api/chat/rooms/${roomId}/voice/mute`, { method:'POST', body: JSON.stringify({ muted }) }); }
  voiceRaiseHand(roomId: string, raised: boolean) { this.sendWs('voice_raise_hand', { roomId, raised }); }
  sendVoiceEvent(type: 'voice_join'|'voice_leave'|'voice_mute'|'voice_raise_hand', payload: any) { this.sendWs(type, payload); }
  sendVoiceSignal(
    roomId: string,
    targetUserId: string,
    signal:
      | { type: 'offer' | 'answer'; sdp: string | null }
      | { candidate: RTCIceCandidateInit },
  ) {
    this.sendWs('voice_signal', { roomId, targetUserId, signal });
  }
  sendLiveLocationUpdate(roomId:string, location:{lat:number;lng:number}) { this.sendWs('live_location_update',{roomId,location}); }
  async uploadChatFile(file: File, roomId?: string) {
    if (file.size > 10 * 1024 * 1024) throw new Error('الملف أكبر من 10MB');
    const data = await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file);});
    return this.request('/api/chat/upload',{method:'POST',body:JSON.stringify({name:file.name,mime:file.type,data,roomId})});
  }
  async votePoll(roomId:string,messageId:string,option:number){ return this.request(`/api/chat/rooms/${roomId}/messages/${messageId}/vote`,{method:'POST',body:JSON.stringify({option})}); }

}

export const chatService = new ChatService();
