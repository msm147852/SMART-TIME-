# Oracle 6 Voice/Video Swap

## Current transport
- Default mode: `p2p`
- Signaling: existing authenticated WebSocket `/ws/chat`
- ICE: Google STUN plus optional TURN from `VITE_TURN_URL`
- UI: `VoiceRoomView`
- Capacity: configurable per room, capped at 50 server-side; default P2P recommendation is 8.

## Switch to Oracle 6 LiveKit
Set frontend environment:
`VITE_VOICE_MODE=livekit`
`VITE_LIVEKIT_URL=wss://<oracle6-host>:7880`
`VITE_TURN_URL=turn:<oracle6-host>:3478`
`VITE_TURN_USER=<turn-user>`
`VITE_TURN_PASS=<turn-password>`

Set backend environment:
`VOICE_MODE=livekit`
`LIVEKIT_URL=wss://<oracle6-host>:7880`
`LIVEKIT_API_KEY=<secret>`
`LIVEKIT_API_SECRET=<secret>`
`COTURN_URL=turn:<oracle6-host>:3478`
`COTURN_USER=<turn-user>`
`COTURN_PASS=<turn-password>`

The backend token endpoint is:
`GET /api/chat/rooms/:roomId/voice/token`

In LiveKit mode it returns a signed room-scoped token. In P2P mode it returns a transport descriptor with the configured ICE servers.

## Oracle 6 services
LiveKit:
```bash
docker run -d --name livekit --restart always \
  -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
  -v /opt/livekit/config.yaml:/config.yaml \
  livekit/livekit-server --config /config.yaml
```

coturn:
```bash
docker run -d --name coturn --restart always \
  -p 3478:3478 -p 3478:3478/udp -p 5349:5349 -p 5349:5349/udp \
  coturn/coturn -n --log-file stdout
```

Do not commit real LiveKit/TURN secrets. Store them only in Oracle 1 / Vercel environment variables.

## Rollback
Set:
`VITE_VOICE_MODE=p2p`
and:
`VOICE_MODE=p2p`

No application code change is required for transport selection.

## Production proof
Before declaring Oracle 6 production-ready, verify:
1. Oracle 6 LiveKit responds and port 7880 is reachable.
2. coturn listens on 3478 TCP/UDP.
3. Authenticated token endpoint returns a valid room-scoped token.
4. Two real devices join the same room.
5. Voice: both hear audio, mute works, leave works.
6. Video: both see video, camera off/on works, leave works.
7. Failure cases: permission denial, provider/network interruption, invalid token, room capacity.
