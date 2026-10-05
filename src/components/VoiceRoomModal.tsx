import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Hand, LogOut, UserPlus, X, Radio } from 'lucide-react';
import { chatService } from '../services/chatService';
import { Language } from '../types';

interface VoiceParticipant {
  userId: string;
  name: string;
  role: 'host' | 'guest' | 'listener';
  muted: boolean;
  handRaised: boolean;
}
interface Props {
  isOpen: boolean;
  roomId: string;
  roomTitle?: string;
  isHost?: boolean;
  onClose: () => void;
  language?: Language;
}

export const VoiceRoomModal: React.FC<Props> = ({
  isOpen, roomId, roomTitle, isHost = false, onClose, language = 'ar',
}) => {
  const isAr = language === 'ar';
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [muted, setMuted] = useState(!isHost);
  const [handRaised, setHandRaised] = useState(false);
  const [joining, setJoining] = useState(false);
  const [micError, setMicError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen || !roomId) return;
    let disposed = false;
    const start = async () => {
      setJoining(true);
      setMicError('');
      try {
        const role = isHost ? 'host' : 'guest';
        const r: any = await chatService.voiceJoin(roomId, role);
        if (!disposed) {
          setParticipants(r?.participants || []);
          setMuted(r?.participant?.muted ?? !isHost);
        }
        if (navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            stream.getAudioTracks().forEach((track) => { track.enabled = isHost; });
          } catch (err: any) {
            if (!disposed) setMicError(err?.name === 'NotAllowedError'
              ? (isAr ? 'تم رفض إذن الميكروفون.' : 'Microphone permission was denied.')
              : (isAr ? 'تعذر تشغيل الميكروفون.' : 'Could not access the microphone.'));
          }
        }
      } catch (err: any) {
        if (!disposed) setMicError(err?.message || (isAr ? 'تعذر دخول الغرفة.' : 'Could not join the room.'));
      } finally {
        if (!disposed) setJoining(false);
      }
    };
    void start();

    const off = chatService.on('voice_room_updated', (p: any) => {
      if (p?.roomId === roomId) setParticipants(p.participants || []);
    });
    const offLeft = chatService.on('voice_participant_left', (p: any) => {
      if (p?.roomId === roomId) setParticipants(p.participants || []);
    });

    return () => {
      disposed = true;
      off();
      offLeft();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      void chatService.voiceLeave(roomId).catch(() => {});
    };
  }, [isOpen, roomId, isHost, isAr]);

  if (!isOpen) return null;

  const setMicEnabled = async (enabled: boolean) => {
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = enabled; });
    setMuted(!enabled);
    try { await chatService.voiceMute(roomId, !enabled); } catch {}
  };

  const toggleMute = () => void setMicEnabled(muted);
  const raiseHand = async () => {
    const next = !handRaised;
    setHandRaised(next);
    chatService.sendVoiceEvent('voice_raise_hand', { roomId, raised: next });
  };
  const leave = async () => {
    await chatService.voiceLeave(roomId).catch(() => {});
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    onClose();
  };
  const invite = async () => {
    const url = window.location.origin + '/invite?room=' + encodeURIComponent(roomId);
    if (navigator.share) {
      try { await navigator.share({ title: roomTitle || 'SMART TIME Voice Room', url }); return; } catch {}
    }
    await navigator.clipboard?.writeText(url);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden border border-slate-700 bg-[#111827] text-white shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center"><Radio /></div>
            <div><h2 className="font-extrabold">{isAr ? 'غرفة صوتية' : 'Voice Room'}</h2><p className="text-xs text-slate-400">{roomTitle || roomId}</p></div>
          </div>
          <button onClick={leave} className="p-2 rounded-xl hover:bg-slate-800" aria-label={isAr ? 'إغلاق' : 'Close'}><X /></button>
        </div>

        {micError && <div className="mx-5 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{micError}</div>}

        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['host', 'guest', 'listener'] as const).map((role) => (
            <div key={role} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <h3 className="text-xs font-bold mb-3">
                {role === 'host' ? (isAr ? 'المضيف' : 'Host') : role === 'guest' ? (isAr ? 'الضيوف' : 'Guests') : (isAr ? 'المستمعون' : 'Listeners')}
              </h3>
              <div className="space-y-2 min-h-16">
                {participants.filter((p) => p.role === role).map((p) => (
                  <div key={p.userId} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{p.name}</span><span>{p.handRaised ? '✋' : p.muted ? '🔇' : '🎙️'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-700 flex flex-wrap gap-2 justify-center">
          <button disabled={joining || !!micError} onClick={toggleMute} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-2">
            {muted ? <MicOff /> : <Mic />}{muted ? (isAr ? 'فتح الميك' : 'Unmute') : (isAr ? 'كتم الميك' : 'Mute')}
          </button>
          <button onClick={raiseHand} className="px-4 py-2.5 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-bold flex items-center gap-2"><Hand />{isAr ? 'رفع اليد' : 'Raise Hand'}</button>
          <button onClick={invite} className="px-4 py-2.5 rounded-xl bg-sky-500/15 text-sky-300 text-xs font-bold flex items-center gap-2"><UserPlus />{isAr ? 'دعوة' : 'Invite'}</button>
          <button onClick={leave} className="px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-300 text-xs font-bold flex items-center gap-2"><LogOut />{isAr ? 'مغادرة' : 'Leave'}</button>
        </div>
      </div>
    </div>
  );
};
