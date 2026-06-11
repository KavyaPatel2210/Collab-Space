import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';

export interface RemoteSpotlight {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

export function useSpotlight(documentId: string, userId: string, userName: string, color: string) {
  const [isSpotlightActive, setIsSpotlightActive] = useState(false);
  const [remoteSpotlights, setRemoteSpotlights] = useState<Record<string, RemoteSpotlight>>({});
  const lastMoveTime = useRef(0);

  useEffect(() => {
    if (!documentId || !userId) return;

    const socket = getSocket();

    const handleSpotlightOn = (data: { userId: string; userName: string; color: string }) => {
      if (data.userId === userId) return;
      setRemoteSpotlights(prev => ({
        ...prev,
        [data.userId]: { ...data, x: 50, y: 50 }
      }));
    };

    const handleSpotlightMoved = (data: { userId: string; x: number; y: number }) => {
      setRemoteSpotlights(prev => {
        if (!prev[data.userId]) return prev;
        return {
          ...prev,
          [data.userId]: { ...prev[data.userId], x: data.x, y: data.y }
        };
      });
    };

    const handleSpotlightOff = (data: { userId: string }) => {
      setRemoteSpotlights(prev => {
        const newState = { ...prev };
        delete newState[data.userId];
        return newState;
      });
    };

    socket.on('spotlight-on', handleSpotlightOn);
    socket.on('spotlight-moved', handleSpotlightMoved);
    socket.on('spotlight-off', handleSpotlightOff);

    return () => {
      socket.off('spotlight-on', handleSpotlightOn);
      socket.off('spotlight-moved', handleSpotlightMoved);
      socket.off('spotlight-off', handleSpotlightOff);
      
      if (isSpotlightActive) {
        socket.emit('spotlight-deactivate', { documentId, userId });
      }
    };
  }, [documentId, userId, isSpotlightActive]);

  const activateSpotlight = useCallback(() => {
    setIsSpotlightActive(true);
    getSocket().emit('spotlight-activate', { documentId, userId, userName, color });
  }, [documentId, userId, userName, color]);

  const deactivateSpotlight = useCallback(() => {
    setIsSpotlightActive(false);
    getSocket().emit('spotlight-deactivate', { documentId, userId });
    getSocket().emit('cursor-leave', { documentId, userId });
  }, [documentId, userId]);

  const handleSpotlightMouseMove = useCallback((e: MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!isSpotlightActive || !containerRef.current) return;
    
    const now = Date.now();
    if (now - lastMoveTime.current < 50) return;
    lastMoveTime.current = now;

    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    getSocket().emit('spotlight-move', { documentId, userId, x, y });
  }, [isSpotlightActive, documentId, userId]);

  return {
    isSpotlightActive,
    remoteSpotlights,
    activateSpotlight,
    deactivateSpotlight,
    handleSpotlightMouseMove
  };
}
