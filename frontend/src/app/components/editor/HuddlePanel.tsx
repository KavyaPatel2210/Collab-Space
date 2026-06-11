import React from 'react';
import { Mic, MicOff, PhoneOff, Phone, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Avatar } from '../ui-components';
import { HuddleParticipant } from '../../hooks/useHuddle';
import { cn } from '../ui-components';

interface HuddlePanelProps {
  documentId: string;
  userId: string;
  userName: string;
  isHuddleActive: boolean;
  isInHuddle: boolean;
  participants: HuddleParticipant[];
  isMuted: boolean;
  activeSpeakers: Set<string>;
  onStart: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
}

export function HuddlePanel({
  isHuddleActive,
  isInHuddle,
  participants,
  isMuted,
  activeSpeakers,
  onStart,
  onJoin,
  onLeave,
  onToggleMute
}: HuddlePanelProps) {
  if (!isHuddleActive && !isInHuddle) {
    return null;
  }

  if (isHuddleActive && !isInHuddle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="font-medium">A voice huddle is active in this document</span>
        </div>
        <button
          onClick={onJoin}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Phone className="w-4 h-4" /> Join Huddle
        </button>
      </motion.div>
    );
  }

  if (isInHuddle) {
    return (
      <div className="w-full bg-emerald-500/10 backdrop-blur-md border-b border-emerald-400/30 px-4 py-2.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Huddle Active</span>
          </div>
          
          <div className="h-4 w-px bg-emerald-300 dark:bg-emerald-700 mx-2" />
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{participants.length} in huddle</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-center max-w-sm">
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map(p => {
              const isSpeaking = activeSpeakers.has(p.userId);
              return (
                <div key={p.userId} className={cn("rounded-full transition-all duration-200", isSpeaking ? "ring-2 ring-emerald-400 animate-pulse z-10" : "ring-2 ring-transparent")}>
                  <Avatar fallback={p.userName.slice(0,2).toUpperCase()} size="sm" />
                </div>
              );
            })}
            {participants.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-xs font-bold text-emerald-800 dark:text-emerald-200 border-2 border-white dark:border-[#0F0D1F] z-10">
                +{participants.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className={cn(
              "p-2 rounded-full transition-colors flex items-center justify-center",
              isMuted ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            onClick={onLeave}
            className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center ml-2"
            title="Leave Huddle"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
