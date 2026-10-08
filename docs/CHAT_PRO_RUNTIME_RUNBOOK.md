# SMART-TIME Chat Pro Runtime Verification Runbook

## Target
- Branch: main
- Latest audited commit: 04dc9d5aeea37d9497694f8d82f2371a0f1ca44f
- Chat CI contract: verify:chat-pro-full + tsc + build
- Voice/video: public live-room fallback until Oracle 6 TURN/STUN/WebRTC infrastructure is deployed.

## Manual Runtime Gate
1. Sign in with a valid SMART-TIME session.
2. Open Chat and confirm tabs are exactly: خاص / مجموعة / الغرف.
3. Private tab: direct rooms only; confirm avatar, online dot, last message, time, unread badge.
4. Group tab: group/public non-live rooms only.
5. Rooms tab: voice/video rooms only; confirm LIVE label, listener count, stacked avatars, Join.
6. Create group: POST /api/chat/rooms with type=group; verify it appears in Group.
7. Create voice room: POST /api/chat/rooms with type=public, roomType=voice, is_voice=true/isVoice=true; verify it appears in Rooms and opens VoiceRoomModal.
8. Create video room: POST /api/chat/rooms with type=public, roomType=video, is_video=true/isVideo=true; verify it appears in Rooms and opens the video fallback UI.
9. Add member by phone: verify normalizeEG -> found / not_found / error states and direct-room creation.
10. Send text, image, video, PDF/file, voice note and location; verify upload limit rejects >10MB.
11. Media preview: image/video/PDF/file opens the correct preview/download behavior.
12. Edit/delete/reply/pin/save messages and confirm realtime updates.
13. Mark a room read and verify read receipt state.
14. Type in two sessions and verify typing indicator; disconnect/reconnect and verify websocket recovery.
15. Voice: allow microphone, join, mute/unmute, raise hand, leave; verify participant updates.
16. Failure cases: deny microphone, disconnect network/provider, send oversized upload, exceed write rate limit; verify controlled error states.
17. Security: private room must reject a non-member; invite/join must require auth and correct room permissions.
18. Stories: API-backed stories load into the horizontal 64px strip.
19. Verify deployment health on Vercel and both Railway environments after deployment becomes READY.
20. Capture screenshots/logs for final owner/runtime sign-off.

## Oracle 1 / Oracle 6
- Oracle 1: database columns and API/Socket integration are now represented in code with safe migrations for room_type, topic, is_voice, is_video and is_live.
- Oracle 6: LiveKit/coturn/TURN/STUN production infrastructure remains deferred; current voice/video is browser WebRTC/public fallback.
