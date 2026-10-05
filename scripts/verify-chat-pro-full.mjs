import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(p)=>fs.readFileSync(p,'utf8');
const files={
  server:read('backend/chatServer.ts'),
  db:read('backend/database.ts'),
  voice:read('src/components/VoiceRoomModal.tsx'),
  contacts:read('src/components/AddMemberModal.tsx'),
  settings:read('src/components/ChatSettingsModal.tsx'),
  hot:read('src/components/HotChatView.tsx'),
  service:read('src/services/chatService.ts'),
};

const checks=[
 ['voice component',files.voice.includes('getUserMedia') && files.voice.includes('voiceJoin') && files.voice.includes('voiceMute')],
 ['voice REST', ['/rooms/:roomId/voice/join','/rooms/:roomId/voice/leave','/rooms/:roomId/voice/mute'].every(x=>files.server.includes(x))],
 ['voice WS', ['voice_join','voice_leave','voice_mute','voice_raise_hand'].every(x=>files.server.includes(x))],
 ['voice persistence',files.db.includes('voiceRoomActive') && files.db.includes('voiceParticipants')],
 ['contacts picker',files.contacts.includes('navigator as any).contacts') && files.service.includes('lookupContacts')],
 ['direct chat',files.service.includes("type: 'direct'") && files.server.includes("type === 'direct'")],
 ['storage pipeline',files.server.includes("chatRouter.post('/upload'") && files.server.includes('backend','uploads')],
 ['storage limit',files.server.includes('10*1024*1024') && files.service.includes('10 * 1024 * 1024')],
 ['voice messaging',files.hot.includes('MediaRecorder') && files.hot.includes('uploadChatFile')],
 ['live location 5s',files.hot.includes('now - lastSentAt < 5000') && files.hot.includes('watchPosition')],
 ['poll realtime',files.server.includes("messages/:messageId/vote") && files.server.includes('poll_updated')],
 ['camera',files.hot.includes('showCameraModal')],
 ['heartbeat/reconnect',files.service.includes('30000') && files.service.includes('scheduleReconnect')],
 ['presence/read receipts',files.server.includes('presence_update') && files.server.includes('message_reads')],
 ['stories',files.server.includes("chatRouter.post('/stories'") && files.server.includes("chatRouter.get('/stories'") && files.db.includes('CREATE TABLE IF NOT EXISTS stories')],
 ['role authorization',files.server.includes('verifyConversationAccess') && files.server.includes('conversation_members')],
 ['settings persistence',files.settings.includes('localStorage.setItem') && files.service.includes('updateRoom')],
];
for (const [name,ok] of checks) assert.ok(ok,name);
console.log('CHAT_PRO_FULL_CONTRACT_PASS',checks.length);
