import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';

export interface HuddleParticipant {
  userId: string;
  userName: string;
  socketId: string;
  isMuted?: boolean;
}

const RTC_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export function useHuddle(documentId: string, userId: string, userName: string) {
  const [isHuddleActive, setIsHuddleActive] = useState(false);
  const [isInHuddle, setIsInHuddle] = useState(false);
  const [participants, setParticipants] = useState<HuddleParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socket = getSocket();

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });
    
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('webrtc-ice-candidate', { to: peerId, candidate: e.candidate, from: userId });
      }
    };
    
    pc.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.play().catch(console.error);
    };
    
    peersRef.current.set(peerId, pc);
    return pc;
  }, [userId, socket]);

  useEffect(() => {
    if (!documentId || !userId) return;

    const onHuddleStarted = ({ initiatorId, initiatorName }: any) => {
      setIsHuddleActive(true);
      if (initiatorId !== userId) {
        setParticipants([{ userId: initiatorId, userName: initiatorName, socketId: '' }]);
      }
    };

    const onPeerJoined = async ({ peers }: { peers: HuddleParticipant[] }) => {
      setParticipants(peers);
      for (const peer of peers) {
        if (peer.userId !== userId) {
          const pc = createPeerConnection(peer.userId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', { to: peer.userId, offer, from: userId });
        }
      }
    };

    const onNewPeer = ({ userId: peerId, userName: peerName, socketId }: HuddleParticipant) => {
      setParticipants(prev => [...prev, { userId: peerId, userName: peerName, socketId }]);
    };

    const onPeerLeft = ({ userId: peerId }: { userId: string }) => {
      setParticipants(prev => prev.filter(p => p.userId !== peerId));
      if (peersRef.current.has(peerId)) {
        peersRef.current.get(peerId)?.close();
        peersRef.current.delete(peerId);
      }
    };

    const onHuddleEnded = () => {
      setIsHuddleActive(false);
      setIsInHuddle(false);
      setParticipants([]);
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };

    const onWebrtcOffer = async ({ offer, from }: any) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { to: from, answer, from: userId });
    };

    const onWebrtcAnswer = async ({ answer, from }: any) => {
      const pc = peersRef.current.get(from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const onWebrtcIceCandidate = async ({ candidate, from }: any) => {
      const pc = peersRef.current.get(from);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const onPeerSpeaking = ({ userId: peerId, isSpeaking }: any) => {
      setActiveSpeakers(prev => {
        const newSet = new Set(prev);
        if (isSpeaking) newSet.add(peerId);
        else newSet.delete(peerId);
        return newSet;
      });
    };

    socket.on('huddle-started', onHuddleStarted);
    socket.on('peer-joined', onPeerJoined);
    socket.on('new-peer', onNewPeer);
    socket.on('peer-left', onPeerLeft);
    socket.on('huddle-ended', onHuddleEnded);
    socket.on('webrtc-offer', onWebrtcOffer);
    socket.on('webrtc-answer', onWebrtcAnswer);
    socket.on('webrtc-ice-candidate', onWebrtcIceCandidate);
    socket.on('peer-speaking', onPeerSpeaking);

    return () => {
      socket.off('huddle-started', onHuddleStarted);
      socket.off('peer-joined', onPeerJoined);
      socket.off('new-peer', onNewPeer);
      socket.off('peer-left', onPeerLeft);
      socket.off('huddle-ended', onHuddleEnded);
      socket.off('webrtc-offer', onWebrtcOffer);
      socket.off('webrtc-answer', onWebrtcAnswer);
      socket.off('webrtc-ice-candidate', onWebrtcIceCandidate);
      socket.off('peer-speaking', onPeerSpeaking);
      
      if (isInHuddle) {
        socket.emit('huddle-leave', { documentId, userId });
        peersRef.current.forEach(pc => pc.close());
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [documentId, userId, socket, createPeerConnection, isInHuddle]);

  const startHuddle = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      socket.emit('huddle-start', { documentId, userId, userName });
      setIsHuddleActive(true);
      setIsInHuddle(true);
      setParticipants([{ userId, userName, socketId: socket.id || '' }]);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const joinHuddle = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      socket.emit('huddle-join', { documentId, userId, userName });
      setIsInHuddle(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const leaveHuddle = () => {
    socket.emit('huddle-leave', { documentId, userId });
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setIsInHuddle(false);
    setParticipants([]);
    setActiveSpeakers(new Set());
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socket.emit('huddle-speaking', { documentId, userId, isSpeaking: audioTrack.enabled });
      }
    }
  };

  return {
    isHuddleActive,
    isInHuddle,
    participants,
    isMuted,
    activeSpeakers,
    startHuddle,
    joinHuddle,
    leaveHuddle,
    toggleMute
  };
}
