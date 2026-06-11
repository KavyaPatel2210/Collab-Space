import { useState } from 'react';
import API from '../lib/api';
import { toast } from 'sonner';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useAIAssistant() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDocumentContext, setUseDocumentContext] = useState(true);

  const sendMessage = async (prompt: string, documentContent?: string) => {
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const history = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    try {
      const res = await API.post('/api/ai/generate', {
        prompt,
        history,
        documentContext: useDocumentContext ? documentContent : undefined
      });

      const assistantMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: res.data.result,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to generate response';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    useDocumentContext,
    setUseDocumentContext
  };
}
