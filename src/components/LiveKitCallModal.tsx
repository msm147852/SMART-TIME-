import React, { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, LocalParticipant, RemoteParticipant, RemoteTrackPublication } from 'livekit-client';
import { Camera, CameraOff, Mic, MicOff, X, PhoneOff, Video, Volume2 } from 'lucide-react';
import { chatService } from '../services/chatService';
import { Language } from '../types';

interface Props { isOpen:boolean; roomId:string; roomTitle?:string; mode:'voice'|'video'; language?:Language; onClose:()=>void; }

export const LiveKitCallModal: React.FC<Props> = ({isOpen,roomId,roomTitle,mode,language='ar',onClose}) => {
  const isAr=language==='ar';
  const roomRef=useRef<Room|null>(null);
  const localVideoRef=useRef<HTMLVideoElement|null>(null);
  const remoteContainerRef=useRef<HTMLDivElement|null>(null);
  const [connected,setConnected]=useState(false);
  const [muted,setMuted]=useState(false);
  const [cameraOff,setCameraOff]=useState(mode!=='video');
  const [error,setError]=useState('');
  const [remoteCount,setRemoteCount]=useState(0);

  const attachRemote=(track: any, participant: RemoteParticipant) => {
    const el=track.attach();
    el.setAttribute('data-livekit-participant',participant.identity);
    el.autoplay=true; el.playsInline=true;
    if(remoteContainerRef.current){ remoteContainerRef.current.appendChild(el); }
  };
  const detachRemote=(track:any) => track.detach().forEach((el:HTMLElement)=>el.remove());

  useEffect(()=>{
    if(!isOpen||!roomId)return;
    let disposed=false;
    const room=new Room({adaptiveStream:true,dynacast:true});
    roomRef.current=room;
    const onSubscribed=(track:any,_pub:RemoteTrackPublication,p:RemoteParticipant)=>{ if(track.kind===Track.Kind.Audio||track.kind===Track.Kind.Video)attachRemote(track,p); setRemoteCount(room.remoteParticipants.size); };
    const onUnsubscribed=(track:any)=>{detachRemote(track);setRemoteCount(room.remoteParticipants.size);};
    room.on(RoomEvent.TrackSubscribed,onSubscribed);
    room.on(RoomEvent.TrackUnsubscribed,onUnsubscribed);
    room.on(RoomEvent.ParticipantConnected,()=>setRemoteCount(room.remoteParticipants.size));
    room.on(RoomEvent.ParticipantDisconnected,()=>setRemoteCount(room.remoteParticipants.size));
    const start=async()=>{
      try{
        const {token,url}=await chatService.getLiveKitToken(roomId);
        await room.connect(url,token,{autoSubscribe:true});
        if(disposed)return;
        const tracks=await room.localParticipant.createTracks({audio:true,video:mode==='video'});
        for(const publication of tracks) await room.localParticipant.publishTrack(publication);
        const localVideo=tracks.find((t:any)=>t.kind===Track.Kind.Video);
        if(localVideo&&localVideoRef.current) localVideo.attach(localVideoRef.current);
        setConnected(true);
        setRemoteCount(room.remoteParticipants.size);
      }catch(e:any){if(!disposed)setError(e?.message|| (isAr?'تعذر الاتصال بـ LiveKit.':'Could not connect to LiveKit.'));}
    };
    void start();
    return()=>{disposed=true;room.removeAllListeners();room.disconnect();roomRef.current=null;};
  },[isOpen,roomId,mode,isAr]);

  if(!isOpen)return null;
  const toggleMute=async()=>{const next=!muted;await roomRef.current?.localParticipant.setMicrophoneEnabled(!next);setMuted(next);};
  const toggleCamera=async()=>{const next=!cameraOff;await roomRef.current?.localParticipant.setCameraEnabled(!next);setCameraOff(next);};
  const leave=()=>{roomRef.current?.disconnect();onClose();};

  return <div className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4" dir={isAr?'rtl':'ltr'}>
    <div className="w-full max-w-4xl rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 text-white shadow-2xl">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div><h2 className="font-black">{mode==='video'?(isAr?'مكالمة فيديو LiveKit':'LiveKit Video Call'):(isAr?'مكالمة صوتية LiveKit':'LiveKit Voice Call')}</h2><p className="text-xs text-slate-400">{roomTitle||roomId} • {remoteCount} {isAr?'متصل':'connected'}</p></div>
        <button onClick={leave} className="p-2 rounded-xl hover:bg-slate-800"><X/></button>
      </div>
      {error?<div className="m-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>:
      <div className="p-5">
        {mode==='video'?<div className="aspect-video rounded-2xl bg-black overflow-hidden relative"><video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover"/><div ref={remoteContainerRef} className="absolute inset-0 grid grid-cols-2 gap-1 pointer-events-none [&>video]:w-full [&>video]:h-full [&>video]:object-cover"/></div>:
        <div ref={remoteContainerRef} className="min-h-64 rounded-2xl bg-slate-900 flex items-center justify-center gap-3 flex-wrap p-6"><Volume2 className="w-10 h-10 text-emerald-400"/><span className="text-slate-300">{connected?(isAr?'متصل بالصوت':'Audio connected'):(isAr?'جاري الاتصال...':'Connecting...')}</span></div>}
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={()=>void toggleMute()} disabled={!connected} className="px-4 py-2.5 rounded-xl bg-slate-800">{muted?<MicOff/>:<Mic/>}</button>
          {mode==='video'&&<button onClick={()=>void toggleCamera()} disabled={!connected} className="px-4 py-2.5 rounded-xl bg-slate-800">{cameraOff?<CameraOff/>:<Camera/>}</button>}
          <button onClick={leave} className="px-5 py-2.5 rounded-xl bg-rose-600"><PhoneOff/></button>
        </div>
      </div>}
    </div>
  </div>;
};
