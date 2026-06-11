import React from 'react';
import { RemoteSpotlight } from '../../hooks/useSpotlight';

interface SpotlightOverlayProps {
  spotlights: Record<string, RemoteSpotlight>;
}

export function SpotlightOverlay({ spotlights }: SpotlightOverlayProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 20 }}>
      <style>
        {`
          @keyframes spotlight-ripple {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
          }
        `}
      </style>
      {Object.values(spotlights).map(spotlight => (
        <div
          key={spotlight.userId}
          style={{
            position: 'absolute',
            left: `${spotlight.x}%`,
            top: `${spotlight.y}%`,
            transition: 'left 80ms linear, top 80ms linear',
          }}
        >
          {/* Ripple effect */}
          <div
            style={{
              position: 'absolute',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: spotlight.color,
              opacity: 0.3,
              animation: 'spotlight-ripple 1.5s infinite ease-out',
            }}
          />
          {/* Main dot */}
          <div
            style={{
              position: 'absolute',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${spotlight.color}CC, ${spotlight.color}44, transparent)`,
              boxShadow: `0 0 20px 8px ${spotlight.color}66`,
              transform: 'translate(-50%, -50%)',
            }}
          />
          {/* Label */}
          <div
            style={{
              position: 'absolute',
              top: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: spotlight.color,
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '12px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {spotlight.userName}
          </div>
        </div>
      ))}
    </div>
  );
}
