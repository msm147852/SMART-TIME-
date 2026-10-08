export const VOICE_CONFIG = {
  mode: (import.meta.env.VITE_VOICE_MODE as 'p2p' | 'livekit') || 'p2p',
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL || '',
  turnUrl: import.meta.env.VITE_TURN_URL || '',
  turnUser: import.meta.env.VITE_TURN_USER || '',
  turnPass: import.meta.env.VITE_TURN_PASS || '',
  maxP2P: 8,
  maxLiveKit: 50,
  stunServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ] as RTCIceServer[],
};
