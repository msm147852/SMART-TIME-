# Oracle 6 — LiveKit/TURN final deployment

This directory contains the production-safe deployment template. Real secrets are intentionally excluded.

## Required Oracle 6 variables
LIVEKIT_API_KEY, LIVEKIT_API_SECRET, ORACLE6_PUBLIC_IP, ORACLE6_PRIVATE_IP, COTURN_USER, COTURN_PASS.

## Deploy
Run `scripts/oracle6-install.sh` on Oracle 6 after setting the variables in the shell. For production, expose LiveKit behind a real DNS name with trusted TLS; LiveKit documents 7880 as the API/WebSocket port and requires SSL termination for a secure deployment. Open TCP 7881 and the configured UDP media range (here 7882-7892), plus TURN 3478/UDP and 5349/TCP if used. citeturn0search0turn0search1

## Backend (Oracle 1)
Set:
LIVEKIT_URL=wss://livekit.<your-domain>
LIVEKIT_API_KEY=<same key>
LIVEKIT_API_SECRET=<same secret>
COTURN_URL=turn:<oracle6-host-or-ip>:3478
COTURN_USER=<coturn user>
COTURN_PASS=<coturn password>

The backend token endpoint is GET /api/chat/rooms/:roomId/voice/token.

## Runtime gate
Do not mark Oracle 6 PASS until:
1. `docker ps` shows livekit and coturn running.
2. ports 7880/7881 and TURN ports are listening.
3. token endpoint returns a token without exposing the API secret.
4. two independent phones join the same voice room and hear each other.
5. two independent phones join the same video room and see each other.
6. mute/camera-off/on/leave are verified.
