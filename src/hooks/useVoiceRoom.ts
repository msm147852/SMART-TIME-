import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_CONFIG } from '../config/voice';
import { chatService } from '../services/chatService';
import { getStoredSession } from '../services/authService';

export interface VoiceRoomParticipant {
  userId: string;
  name: string;
  role: 'host' | 'guest' | 'listener';
  muted: boolean;
  handRaised: boolean;
}

export function useVoiceRoom(roomId: string) {
  const [participants, setParticipants] = useState<VoiceRoomParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const remoteAudio = useRef<Record<string, HTMLAudioElement>>({});
  const remoteStreams = useRef<Record<string, MediaStream>>({});
  const selfId = useRef(getStoredSession()?.user?.id || '');
  const joined = useRef(false);

  const iceServers: RTCIceServer[] = [
    ...VOICE_CONFIG.stunServers,
    ...(VOICE_CONFIG.turnUrl
      ? [{ urls: VOICE_CONFIG.turnUrl, username: VOICE_CONFIG.turnUser || undefined, credential: VOICE_CONFIG.turnPass || undefined }]
      : []),
  ];

  const closePeer = useCallback((userId: string) => {
    peers.current[userId]?.close();
    delete peers.current[userId];
    remoteAudio.current[userId]?.pause();
    delete remoteAudio.current[userId];
    delete remoteStreams.current[userId];
  }, []);

  const attachPeer = useCallback((remoteId: string, pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.onicecandidate = (event) => {
      if (event.candidate) chatService.sendVoiceSignal(roomId, remoteId, { candidate: event.candidate.toJSON() });
    };
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;
      remoteStreams.current[remoteId] = remoteStream;
      const audio = remoteAudio.current[remoteId] || new Audio();
      audio.autoplay = true;
      audio.srcObject = remoteStream;
      remoteAudio.current[remoteId] = audio;
      void audio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) closePeer(remoteId);
    };
  }, [closePeer, roomId]);

  const createPeer = useCallback(async (remoteId: string, stream: MediaStream) => {
    if (!remoteId || remoteId === selfId.current || peers.current[remoteId]) return;
    const pc = new RTCPeerConnection({ iceServers });
    peers.current[remoteId] = pc;
    attachPeer(remoteId, pc, stream);
    if (selfId.current < remoteId) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      chatService.sendVoiceSignal(roomId, remoteId, { type: 'offer', sdp: offer.sdp });
    }
  }, [attachPeer, roomId, iceServers]);

  const handleSignal = useCallback(async (payload: any) => {
    if (!payload || payload.roomId !== roomId || !payload.fromUserId || !localStream) return;
    const remoteId = String(payload.fromUserId);
    let pc = peers.current[remoteId];
    if (!pc) {
      pc = new RTCPeerConnection({ iceServers });
      peers.current[remoteId] = pc;
      attachPeer(remoteId, pc, localStream);
    }
    const signal = payload.signal || {};
    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        chatService.sendVoiceSignal(roomId, remoteId, { type: 'answer', sdp: answer.sdp });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
      } else if (signal.candidate) {
        await pc.addIceCandidate(signal.candidate);
      }
    } catch (err) {
      console.warn('P2P voice/video signaling failed:', err);
    }
  }, [attachPeer, iceServers, localStream, roomId]);

  const join = useCallback(async (isVideo = false) => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('المتصفح لا يدعم الميكروفون/الكاميرا.');
    const stored = getStoredSession();
    selfId.current = stored?.user?.id || selfId.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
    setLocalStream(stream);
    setIsCameraOn(isVideo);
    const response: any = await chatService.voiceJoin(roomId, 'guest');
    const nextParticipants = Array.isArray(response?.participants) ? response.participants : [];
    setParticipants(nextParticipants);
    joined.current = true;
    setIsMuted(false);
    stream.getAudioTracks().forEach((track) => { track.enabled = true; });
    for (const p of nextParticipants) {
      if (p.userId !== selfId.current) await createPeer(p.userId, stream);
    }
    return stream;
  }, [createPeer, roomId]);

  const leave = useCallback(async () => {
    joined.current = false;
    Object.keys(peers.current).forEach(closePeer);
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setIsCameraOn(false);
    setIsMuted(false);
    await chatService.voiceLeave(roomId).catch(() => {});
  }, [closePeer, localStream, roomId]);

  const toggleMute = useCallback(async () => {
    const nextMuted = !isMuted;
    localStream?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setIsMuted(nextMuted);
    await chatService.voiceMute(roomId, nextMuted).catch(() => {});
  }, [isMuted, localStream, roomId]);

  const toggleCamera = useCallback(() => {
    const next = !isCameraOn;
    localStream?.getVideoTracks().forEach((track) => { track.enabled = next; });
    setIsCameraOn(next);
  }, [isCameraOn, localStream]);

  useEffect(() => {
    const offUpdated = chatService.on('voice_room_updated', (payload: any) => {
      if (payload?.roomId !== roomId) return;
      const next = Array.isArray(payload.participants) ? payload.participants : [];
      setParticipants(next);
      if (localStream) {
        for (const p of next) {
          if (p.userId !== selfId.current && !peers.current[p.userId]) void createPeer(p.userId, localStream);
        }
      }
      for (const userId of Object.keys(peers.current)) {
        if (!next.some((p: VoiceRoomParticipant) => p.userId === userId)) closePeer(userId);
      }
    });
    const offLeft = chatService.on('voice_participant_left', (payload: any) => {
      if (payload?.roomId !== roomId) return;
      setParticipants(payload.participants || []);
      if (payload.userId) closePeer(String(payload.userId));
    });
    const offSignal = chatService.on('voice_signal', (payload: any) => { void handleSignal(payload); });
    return () => { offUpdated(); offLeft(); offSignal(); };
  }, [closePeer, createPeer, handleSignal, localStream, roomId]);

  useEffect(() => () => {
    Object.keys(peers.current).forEach(closePeer);
    localStream?.getTracks().forEach((track) => track.stop());
    if (joined.current) void chatService.voiceLeave(roomId).catch(() => {});
  }, [closePeer, localStream, roomId]);

  return { participants, isMuted, isCameraOn, localStream, error, join, leave, toggleMute, toggleCamera, setError };
}
