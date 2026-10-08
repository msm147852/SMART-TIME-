import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(p)=>fs.readFileSync(p,'utf8');
const checks = [
  ['voice config', read('src/config/voice.ts').includes("mode:") && read('src/config/voice.ts').includes('maxP2P')],
  ['P2P hook', read('src/hooks/useVoiceRoom.ts').includes('RTCPeerConnection') && read('src/hooks/useVoiceRoom.ts').includes('getUserMedia')],
  ['P2P TURN/STUN', read('src/hooks/useVoiceRoom.ts').includes('iceServersRef') && read('src/config/voice.ts').includes('stunServers')],
  ['voice token transport', read('backend/chatServer.ts').includes("voice/token") && read('backend/chatServer.ts').includes("mode:'p2p'")],
  ['voice WS signaling', ['voice_signal','voice_room_updated','voice_participant_left'].every(x=>read('backend/chatServer.ts').includes(x))],
  ['voice room capacity', read('backend/chatServer.ts').includes('maxParticipants') && read('backend/database.ts').includes('max_participants')],
  ['voice create type', read('src/components/chat/CreateVoiceRoomModal.tsx').includes("type:'voice'") && read('src/components/chat/CreateVoiceRoomModal.tsx').includes('maxParticipants')],
  ['video create type', read('src/components/chat/CreateVideoRoomModal.tsx').includes("type:'video'") && read('src/components/chat/CreateVideoRoomModal.tsx').includes('maxParticipants')],
  ['voice room view', read('src/components/chat/VoiceRoomView.tsx').includes('useVoiceRoom') && read('src/components/chat/VoiceRoomView.tsx').includes('Mute')],
  ['env swap', read('src/config/voice.ts').includes('VITE_VOICE_MODE') && read('docs/ORACLE_SWAP.md').includes('VITE_VOICE_MODE=livekit')],
];
for (const [name,ok] of checks) assert.ok(ok,name);
console.log('CHAT_P2P_CONTRACT_PASS',checks.length);
