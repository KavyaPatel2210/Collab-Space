import React from 'react';
import { RemoteCursor } from '../../hooks/useCursorPresence';

interface CursorOverlayProps {
  cursors: Record<string, RemoteCursor>;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export function CursorOverlay({ cursors }: CursorOverlayProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Object.values(cursors).map(cursor => (
        <div
          key={cursor.userId}
          style={{
            position: 'absolute',
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transition: 'left 200ms ease-out, top 200ms ease-out',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            opacity: 1
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              filter: cursor.isSpeaking ? `drop-shadow(0 0 6px ${cursor.color})` : 'none',
              transition: 'filter 0.2s ease-in-out'
            }}
          >
            <path
              d="M2.5 0L15.5 5.5L8.5 8.5L5.5 15.5L2.5 0Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              backgroundColor: cursor.color,
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '8px',
              marginTop: '2px',
              marginLeft: '8px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
}
