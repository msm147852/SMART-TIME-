# SMART TIME Chat Pro Full

Branch: `feat/chat-pro-full`  
Base: `main`

## Implemented
- Voice Room UI with Host / Guests / Listeners, mute/unmute, raise hand, leave and invite.
- WebSocket voice events: `voice_join`, `voice_leave`, `voice_mute`, `voice_raise_hand`.
- Voice room REST APIs and persisted `voiceRoomActive` / `voiceParticipants`.
- Real microphone permission handling in the voice room.
- Phone Contact Picker with server lookup and fallback to SMART TIME users.
- Direct-chat creation for registered contacts.
- Invite flow for unregistered contacts with copy, WhatsApp share and QR.
- Chat settings persistence to localStorage plus room PUT API.
- Room profile/avatar, wallpaper presets, notification/privacy/chat/role settings.
- Backend upload pipeline with 10MB enforcement and real file URLs.
- MediaRecorder voice notes with playable audio URLs.
- Live-location WebSocket updates and realtime poll voting.
- Camera modal uses real `getUserMedia`.
- WebSocket heartbeat/reconnect and presence/read receipts remain wired.
- Stories POST/GET backend and database table.
- Conversation-member role checks on chat mutations.

## Protected scope
No changes were intentionally made to `TRIAL_MODE`, `phoneVerified`, account activation/credibility logic, or phone verification flow.

## Verification policy
Presence of code is not treated as a PASS. Final acceptance requires UI -> API -> database/WebSocket runtime verification for every Chat Pro action, including permission denial, reconnect, uploads over/under 10MB, voice room state, contacts lookup, read receipts, polls, live location and stories.
