import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';

export interface RemoteCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  isSpeaking?: boolean;
  lastSeen: number;
}

const CURSOR_COLORS = [
  '#F87171','#FB923C','#FBBF24','#34D399','#38BDF8','#818CF8','#F472B6','#A78BFA'
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export function useCursorPresence(documentId: string, userId: string, userName: string, editorRef: React.RefObject<HTMLDivElement | null>) {
  const [remoteCursorsState, setRemoteCursorsState] = useState<Record<string, RemoteCursor>>({});
  const lastMoveEmitTime = useRef(0);

  const updateSpeakingStatus = useCallback((uid: string, isSpeaking: boolean) => {
    setRemoteCursorsState(prev => {
      if (!prev[uid]) return prev;
      return { ...prev, [uid]: { ...prev[uid], isSpeaking } };
    });
  }, []);

  useEffect(() => {
    if (!documentId || !userId) return;
    
    const socket = getSocket();

    const handleCursorUpdated = (data: { userId: string; userName: string; x: number; y: number; color: string }) => {
      if (data.userId === userId) return;
      setRemoteCursorsState(prev => ({
        ...prev,
        [data.userId]: { ...data, lastSeen: Date.now(), isSpeaking: prev[data.userId]?.isSpeaking }
      }));
    };

    const handleCursorRemoved = (data: { userId: string }) => {
      setRemoteCursorsState(prev => {
        const newState = { ...prev };
        delete newState[data.userId];
        return newState;
      });
    };

    socket.on('cursor-updated', handleCursorUpdated);
    socket.on('cursor-removed', handleCursorRemoved);

    const staleInterval = setInterval(() => {
      const now = Date.now();
      setRemoteCursorsState(prev => {
        let hasStale = false;
        const newState = { ...prev };
        for (const [uid, cursor] of Object.entries(newState)) {
          if (now - cursor.lastSeen > 5000) {
            delete newState[uid];
            hasStale = true;
          }
        }
        return hasStale ? newState : prev;
      });
    }, 5000);

    const handleMouseMove = (e: MouseEvent) => {
      if (!editorRef.current) return;
      
      const now = Date.now();
      if (now - lastMoveEmitTime.current < 50) return;
      lastMoveEmitTime.current = now;

      const rect = editorRef.current.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      socket.emit('cursor-move', {
        documentId,
        userId,
        userName,
        x,
        y,
        color: getUserColor(userId)
      });
    };

    const handleMouseLeave = () => {
      socket.emit('cursor-leave', { documentId, userId });
    };

    const currentEditorRef = editorRef.current;
    if (currentEditorRef) {
      currentEditorRef.addEventListener('mousemove', handleMouseMove);
      currentEditorRef.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      socket.off('cursor-updated', handleCursorUpdated);
      socket.off('cursor-removed', handleCursorRemoved);
      clearInterval(staleInterval);
      
      if (currentEditorRef) {
        currentEditorRef.removeEventListener('mousemove', handleMouseMove);
        currentEditorRef.removeEventListener('mouseleave', handleMouseLeave);
      }
      
      socket.emit('cursor-leave', { documentId, userId });
    };
  }, [documentId, userId, userName, editorRef]);

  return { remoteCursors: remoteCursorsState, updateSpeakingStatus };
}
