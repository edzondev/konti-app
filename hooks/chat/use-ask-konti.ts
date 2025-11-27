import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { askKonti, askKontiQuickPrompt } from '@/services/classification';
import type { ChatMessage, QuickPrompt } from '@/types/ai-extraction.types';

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'limit_status',
    text: '¿Cómo va mi límite anual?',
    icon: 'chart-pie',
  },
  {
    id: 'pending_review',
    text: '¿Qué comprobantes necesitan revisión?',
    icon: 'alert-circle',
  },
  {
    id: 'summary',
    text: 'Dame un resumen de mis gastos',
    icon: 'file-text',
  },
  {
    id: 'tips',
    text: 'Consejos para deducir más',
    icon: 'lightbulb',
  },
];

interface UseAskKontiReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  contextSummary: {
    total_receipts: number;
    deductible_amount: number;
    percentage_used: number;
  } | null;
  sendMessage: (message: string) => Promise<void>;
  sendQuickPrompt: (promptId: string) => Promise<void>;
  clearChat: () => void;
}

export function useAskKonti(): UseAskKontiReturn {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contextSummary, setContextSummary] = useState<{
    total_receipts: number;
    deductible_amount: number;
    percentage_used: number;
  } | null>(null);

  const messageMutation = useMutation({
    mutationFn: async ({
      question,
      isQuickPrompt,
    }: {
      question: string;
      isQuickPrompt: boolean;
    }) => {
      if (!session?.user.id) {
        throw new Error('Usuario no autenticado');
      }

      if (isQuickPrompt) {
        return askKontiQuickPrompt(session.user.id, question);
      }

      return askKonti(session.user.id, question, messages);
    },
    onSuccess: (data, variables) => {
      if (data.success && data.data) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setContextSummary(data.data.context_summary);
        setError(null);
      } else {
        setError(data.error || 'Error al procesar la respuesta');
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    },
  });

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      await messageMutation.mutateAsync({
        question: message,
        isQuickPrompt: false,
      });
    },
    [messageMutation],
  );

  const sendQuickPrompt = useCallback(
    async (promptId: string) => {
      const prompt = QUICK_PROMPTS.find((p) => p.id === promptId);
      if (!prompt) return;

      const userMessage: ChatMessage = {
        role: 'user',
        content: prompt.text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      await messageMutation.mutateAsync({
        question: promptId,
        isQuickPrompt: true,
      });
    },
    [messageMutation],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setContextSummary(null);
  }, []);

  return {
    messages,
    isLoading: messageMutation.isPending,
    error,
    contextSummary,
    sendMessage,
    sendQuickPrompt,
    clearChat,
  };
}
