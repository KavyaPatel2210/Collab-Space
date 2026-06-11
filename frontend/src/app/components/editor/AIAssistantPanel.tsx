import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Trash2, SendHorizonal, Bot } from 'lucide-react';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { cn } from '../ui-components';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentContent: string;
  onInsert: (text: string) => void;
}

export function AIAssistantPanel({ isOpen, onClose, documentContent, onInsert }: AIAssistantPanelProps) {
  const { messages, isLoading, sendMessage, clearHistory, useDocumentContext, setUseDocumentContext } = useAIAssistant();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input, documentContent);
    setInput('');
  };

  const quickActions = [
    { label: '✨ Generate Draft', prompt: 'Generate a draft for this document.' },
    { label: '📋 Summarize', prompt: 'Summarize the contents of this document.' },
    { label: '✍️ Improve Writing', prompt: 'Improve the writing and tone of the current text.' },
    { label: '💡 Brainstorm', prompt: 'Brainstorm 5 new ideas based on this document.' }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 md:relative md:inset-auto md:w-80 border-l border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F0D1F] flex flex-col shadow-xl z-30"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10 font-bold flex justify-between items-center bg-white dark:bg-[#0F0D1F] sticky top-0 z-10">
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
          <Sparkles className="w-4 h-4" />
          <span>AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearHistory} className="p-1.5 hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-[#1E1B4B]/50">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Use document context</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={useDocumentContext} onChange={() => setUseDocumentContext(!useDocumentContext)} />
          <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
        </label>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {messages.length === 0 && (
          <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-white/5 shrink-0">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => { setInput(action.prompt); }}
                className="whitespace-nowrap px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-full text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-[#0A0914]/50">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
              <Bot className="w-12 h-12 text-violet-500 mb-3" />
              <p className="text-sm font-medium">How can I help you with this document?</p>
            </div>
          )}
          
          {messages.map((m) => (
            <div key={m.id} className={cn(
              "flex flex-col max-w-[90%] text-sm",
              m.role === 'user' ? "self-end items-end" : "self-start items-start"
            )}>
              <div className={cn(
                "p-3 rounded-2xl shadow-sm break-words whitespace-pre-wrap",
                m.role === 'user' 
                  ? "bg-violet-600 text-white rounded-tr-sm" 
                  : "bg-white dark:bg-[#1E1B4B] border dark:border-white/5 text-gray-800 dark:text-gray-100 rounded-tl-sm"
              )}>
                {m.content}
              </div>
              {m.role === 'assistant' && (
                <button
                  onClick={() => onInsert(m.content)}
                  className="mt-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline px-1"
                >
                  + Insert into document
                </button>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="self-start max-w-[85%] p-3 rounded-2xl bg-white dark:bg-[#1E1B4B] border dark:border-white/5 rounded-tl-sm flex gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F0D1F]">
        <div className="relative flex items-end">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask AI for help..." 
            className="w-full bg-gray-50 dark:bg-[#1E1B4B]/50 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-3 pr-10 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[44px] max-h-32"
            rows={1}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 bottom-1.5 p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-colors"
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
