import { useEffect, useRef, useMemo } from 'react';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useFreeMessagesStore } from '@/store/use-free-messages-store';

const FREE_MESSAGES_LIMIT = 5;

export function useFreeMessages() {
  const { currentPlan, hasPlus } = useUserPlan();
  const messagesUsed = useFreeMessagesStore((state) => state.messagesUsed);
  const { incrementMessage, resetMessages } = useFreeMessagesStore();
  const prevHasPlusRef = useRef(hasPlus);

  // Reset free messages when user upgrades to Plus
  useEffect(() => {
    const wasFree = prevHasPlusRef.current === false;
    const isNowPlus = hasPlus === true;

    if (wasFree && isNowPlus && messagesUsed > 0) {
      resetMessages();
    }

    prevHasPlusRef.current = hasPlus;
  }, [hasPlus, messagesUsed, resetMessages]);

  const messagesRemaining = useMemo(() => {
    if (hasPlus) return Number.POSITIVE_INFINITY;
    return Math.max(0, FREE_MESSAGES_LIMIT - messagesUsed);
  }, [hasPlus, messagesUsed]);

  const hasReachedLimitValue = useMemo(() => {
    if (hasPlus) return false;
    return messagesUsed >= FREE_MESSAGES_LIMIT;
  }, [hasPlus, messagesUsed]);

  const canSendMessage = useMemo(() => {
    if (hasPlus) return true;
    return !hasReachedLimitValue;
  }, [hasPlus, hasReachedLimitValue]);

  const registerMessage = () => {
    if (hasPlus) return;
    incrementMessage();
  };

  return {
    messagesRemaining,
    messagesUsed,
    hasReachedLimit: hasReachedLimitValue,
    canSendMessage,
    registerMessage,
    currentPlan,
  };
}
