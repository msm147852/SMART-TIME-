import React, { useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Users, Hand, X } from 'lucide-react';
import { useVoiceRoom } from '../../hooks/useVoiceRoom';
import { VOICE_CONFIG } from '../../config/voice';
import { chatService } from '../../services/chatService';
import { Language } from '../../types';

interface RoomLike { id:string; title?:string; name?:string; topic?:string; maxParticipants?:number; }
interface Props { room:RoomLike; isVideo?:boolean; onClose:()=>void; language?:Language; }

export const VoiceRoomView: React.FC<Props> = ({room,isVideo=false,onClose,language='ar'}) => {
  const isAr=language==='ar';
  const {participants,isMuted,isCameraOn,localStream,error,join,leave,toggleMute,toggleCamera,setError}=useVoiceRoom(room.id);
  const localVideoRef=useRef<HTMLVideoElement|null>(null);
  const max=room.maxParticipants||VOICE_CONFIG.maxP2P;

  useEffect(()=>{
    void join(isVideo).catch((e:any)=>setError(e?.name==='NotAllowedError'?(isAr?'تم رفض صلاحية الميكروفون/الكاميرا.':'Microphone/camera permission denied.'):e?.message||'تعذر تشغيل الغرفة.'));
    return()=>{void leave();};
  },[isVideo,isAr,join,leave,setError]);

  useEffect(()=>{
    if(localVideoRef.current&&localStream){localVideoRef.current.srcObject=localStream;}
  },[localStream]);

  const exit=async()=>{await leave();onClose();};

  return <div className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4" dir={isAr?'rtl':'ltr'}>
    <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div><h2 className="font-black">{isVideo?(isAr?'غرفة فيديو P2P':'P2P Video Room'):(isAr?'غرفة صوتية P2P':'P2P Voice Room')}</h2><p className="text-xs text-slate-400">{room.title||room.name||room.id} · {room.topic||''}</p></div>
        <button onClick={()=>void exit()} className="p-2 rounded-xl hover:bg-slate-800" aria-label={isAr?'إغلاق':'Close'}><X/></button>
      </div>
      {participants.length>=max && <div className="mx-5 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">{isAr?('الغرفة ممتلئة ('+max+' مستخدمين). الترقية لـ Oracle 6 تدعم عددًا أكبر.'):'Room full ('+max+' users). Oracle 6 SFU supports more.'}</div>}
      {error&&<div className="mx-5 mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</div>}
      <div className="p-5">
        {isVideo?<div className="aspect-video rounded-2xl bg-black overflow-hidden relative"><video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover"/><div className="absolute inset-0 grid grid-cols-2 gap-1 pointer-events-none">{participants.slice(0,3).map(p=><div key={p.userId} className="bg-slate-900/70 rounded-xl flex items-center justify-center text-sm">{p.name}</div>)}</div></div>
        :<div className="min-h-72 rounded-2xl bg-slate-900 flex flex-col items-center justify-center gap-4"><Users className="w-12 h-12 text-emerald-400"/><div className="text-lg font-bold">{participants.length} {isAr?'متصل':'connected'}</div><div className="text-sm text-slate-400">{isAr?'الصوت مباشر عبر WebRTC':'Live audio via WebRTC'}</div></div>}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={()=>void toggleMute()} className="rounded-2xl bg-slate-800 py-3 flex items-center justify-center gap-2">{isMuted?<MicOff/>:<Mic/>}{isAr?(isMuted?'فتح الميك':'كتم الميك'):(isMuted?'Unmute':'Mute')}</button>
          {isVideo&&<button onClick={()=>toggleCamera()} className="rounded-2xl bg-slate-800 py-3 flex items-center justify-center gap-2">{isCameraOn?<Camera/>:<CameraOff/>}{isAr?'الكاميرا':'Camera'}</button>}
          <button onClick={()=>chatService.sendVoiceEvent('voice_raise_hand',{roomId:room.id,raised:true})} className="rounded-2xl bg-amber-500/15 text-amber-200 py-3 flex items-center justify-center gap-2"><Hand/>{isAr?'رفع اليد':'Raise hand'}</button>
          <button onClick={()=>void exit()} className="rounded-2xl bg-rose-600 py-3 flex items-center justify-center gap-2"><PhoneOff/>{isAr?'مغادرة':'Leave'}</button>
        </div>
      </div>
    </div>
  </div>;
};
