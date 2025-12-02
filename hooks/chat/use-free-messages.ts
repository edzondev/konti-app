import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useFreeMessagesStore } from '@/store/use-free-messages-store';

const FREE_MESSAGES_LIMIT = 5;

export function useFreeMessages() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { currentPlan, hasPlus } = useUserPlan();

  const messagesUsedMap = useFreeMessagesStore((state) => state.messagesUsed);

  const messagesUsed = useMemo(() => {
    if (!userId) return 0;
    return messagesUsedMap[userId] ?? 0;
  }, [userId, messagesUsedMap]);

  const { incrementMessage } = useFreeMessagesStore();

  const messagesRemaining = useMemo(() => {
    if (hasPlus) return Number.POSITIVE_INFINITY;
    return Math.max(0, FREE_MESSAGES_LIMIT - messagesUsed);
  }, [hasPlus, messagesUsed]);

  const hasReachedLimitValue = useMemo(() => {
    if (!userId || hasPlus) return false;
    return messagesUsed >= FREE_MESSAGES_LIMIT;
  }, [userId, hasPlus, messagesUsed]);

  const canSendMessage = useMemo(() => {
    if (hasPlus) return true;
    return !hasReachedLimitValue;
  }, [hasPlus, hasReachedLimitValue]);

  const registerMessage = () => {
    if (!userId || hasPlus) return;
    incrementMessage(userId);
  };

  const prevHasPlusRef = useRef(hasPlus);

  useEffect(() => {
    if (!userId) return;

    const wasFree = prevHasPlusRef.current === false;
    const isNowPlus = hasPlus === true;

    if (wasFree && isNowPlus) {
      const store = useFreeMessagesStore.getState();
      const currentUsed = store.messagesUsed[userId] ?? 0;
      if (currentUsed > 0) {
        store.resetMessages(userId);
      }
    }

    prevHasPlusRef.current = hasPlus;
  }, [hasPlus, userId]);

  return {
    messagesRemaining,
    messagesUsed,
    hasReachedLimit: hasReachedLimitValue,
    canSendMessage,
    registerMessage,
    currentPlan,
  };
}
