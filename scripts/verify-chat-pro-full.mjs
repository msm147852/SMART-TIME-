import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(p)=>fs.readFileSync(p,'utf8');
const files={
  server:read('backend/chatServer.ts'),
  db:read('backend/database.ts'),
  voice:read('src/components/VoiceRoomModal.tsx'),
  livekit:read('src/components/LiveKitCallModal.tsx'),
  contacts:read('src/components/AddMemberModal.tsx'),
  settings:read('src/components/ChatSettingsModal.tsx'),
  hot:read('src/components/HotChatView.tsx'),
  service:read('src/services/chatService.ts'),
};

const checks=[
 ['voice component',files.voice.includes('getUserMedia') && files.voice.includes('voiceJoin') && files.voice.includes('voiceMute')],
 ['voice REST', ['/rooms/:roomId/voice/join','/rooms/:roomId/voice/leave','/rooms/:roomId/voice/mute'].every(x=>files.server.includes(x))],
 ['voice WS + WebRTC signaling', ['voice_join','voice_leave','voice_mute','voice_raise_hand','voice_signal','sendToUser'].every(x=>files.server.includes(x)) && files.service.includes('sendVoiceSignal') && files.voice.includes('RTCPeerConnection')],
 ['voice persistence',files.db.includes('voiceRoomActive') && files.db.includes('voiceParticipants')],
 ['contacts picker',files.contacts.includes('navigator as any).contacts') && files.service.includes('lookupContacts')],
 ['direct chat',files.service.includes("'direct'") && files.server.includes("type === 'direct'")],
 ['storage pipeline',files.server.includes("chatRouter.post('/upload'") && files.server.includes("path.join(process.cwd(),'backend','uploads')")],
 ['storage limit',files.server.includes('10*1024*1024') && files.service.includes('10 * 1024 * 1024')],
 ['voice messaging',files.hot.includes('MediaRecorder') && files.hot.includes('uploadChatFile')],
 ['live location 5s',files.hot.includes('now - lastSentAt < 5000') && files.hot.includes('watchPosition')],
 ['poll realtime',files.server.includes("messages/:messageId/vote") && files.server.includes('poll_updated')],
 ['camera',files.hot.includes('showCameraModal')],
 ['heartbeat/reconnect',files.service.includes('30000') && files.service.includes('scheduleReconnect')],
 ['presence/read receipts',files.server.includes('presence_update') && files.server.includes('message_reads')],
 ['stories',files.server.includes("chatRouter.post('/stories'") && files.server.includes("chatRouter.get('/stories'") && files.db.includes('CREATE TABLE IF NOT EXISTS stories')],
 ['role authorization + API enforcement',files.server.includes('verifyConversationAccess') && files.server.includes('chatPermissionAllowed') && files.server.includes('conversation_members')],
 ['settings persistence',files.settings.includes('localStorage.setItem') && files.service.includes('updateRoom')],
 ['poll authorization',files.server.includes("chatPermissionAllowed(user.id,roomId,'sendMessages')")],
 ['saved-message authorization',files.server.includes("SELECT conversation_id FROM messages WHERE id = ? AND is_deleted = 0")],
 ['WS room authorization',files.server.includes("live_location_error") && files.server.includes("typing_error")],

  ['archive P2',files.db.includes('archived_rooms') && files.server.includes("chatRouter.put('/rooms/:roomId/archive'") && files.hot.includes('handleArchiveRoom')],
 ['block P2',files.db.includes('blocked_users') && files.server.includes("chatRouter.post('/users/:id/block'") && files.server.includes("chatRouter.post('/users/:id/unblock'") && files.hot.includes('handleBlockActiveUser')],
 ['forward P2',files.db.includes('original_message_id') && files.server.includes('forwarded') && files.service.includes('forwardMessage') && files.hot.includes('selectedForwardRooms')],
 ['reactions P2',files.db.includes('message_reactions') && files.server.includes('message_reactions_updated') && files.hot.includes("['❤️','😂','😮','😢','🙏']")],
 ['auto-delete P2',files.db.includes('auto_delete_duration') && files.server.includes("chatRouter.put('/rooms/:roomId/auto-delete'") && files.server.includes('purgeExpiredChatMessages') && files.settings.includes('autoDeleteDuration')],
 ['notification/wallpaper P2',files.db.includes('room_settings') && files.server.includes("chatRouter.put('/rooms/:roomId/settings'") && files.hot.includes('updateRoomSettings')],
 ['oracle6 LiveKit',files.livekit.includes("room.connect") && files.livekit.includes('createTracks') && files.server.includes("voice/token") && files.hot.includes('LiveKitCallModal') && files.service.includes('getLiveKitToken')],
];
for (const [name,ok] of checks) assert.ok(ok,name);
console.log('CHAT_PRO_FULL_CONTRACT_PASS',checks.length);
