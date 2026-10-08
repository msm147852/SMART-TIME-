# Oracle 6 — LiveKit/TURN final deployment

This directory contains the production-safe deployment template. Real secrets are intentionally excluded.

## Required Oracle 6 variables
LIVEKIT_API_KEY, LIVEKIT_API_SECRET, ORACLE6_PUBLIC_IP, ORACLE6_PRIVATE_IP, COTURN_USER, COTURN_PASS.

## Deploy
Run `scripts/oracle6-install.sh` on Oracle 6 after setting the variables in the shell. Open TCP 7880/7881, UDP 3478, TCP/UDP 5349, and UDP 7882-7892 in the Oracle security list and OS firewall.

## Backend (Oracle 1)
Set:
LIVEKIT_URL=wss://<oracle6-host-or-ip>:7880
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
