import { renderHook, act } from '@testing-library/react-native';
import { useFreeMessages } from '@/hooks/chat/use-free-messages';
import { useFreeMessagesStore } from '@/store/use-free-messages-store';

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(() => null),
    remove: jest.fn(),
  })),
}));

const mockUseAuth = jest.fn();
const mockUseUserPlan = jest.fn();

jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/hooks/profile/use-user-plan', () => ({
  useUserPlan: () => mockUseUserPlan(),
}));

describe('useFreeMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const store = useFreeMessagesStore.getState();
    Object.keys(store.messagesUsed).forEach((userId) => {
      store.resetMessages(userId);
    });

    mockUseAuth.mockReturnValue({
      session: { user: { id: 'test-user-id' } },
    });

    mockUseUserPlan.mockReturnValue({
      currentPlan: 'free' as const,
      hasPlus: false,
    });
  });

  it('should initialize with correct values', () => {
    const { result } = renderHook(() => useFreeMessages());

    expect(result.current.messagesUsed).toBe(0);
    expect(result.current.messagesRemaining).toBe(5);
    expect(result.current.hasReachedLimit).toBe(false);
    expect(result.current.canSendMessage).toBe(true);
  });

  it('should calculate remaining messages correctly', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      store.incrementMessage('test-user-id');
      store.incrementMessage('test-user-id');
    });

    const { result } = renderHook(() => useFreeMessages());

    expect(result.current.messagesRemaining).toBe(3);
    expect(result.current.messagesUsed).toBe(2);
  });

  it('should detect limit and block sending', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      for (let i = 0; i < 5; i++) {
        store.incrementMessage('test-user-id');
      }
    });

    const { result } = renderHook(() => useFreeMessages());

    expect(result.current.hasReachedLimit).toBe(true);
    expect(result.current.canSendMessage).toBe(false);
    expect(result.current.messagesRemaining).toBe(0);
  });

  it('should return Infinity for PLUS users', () => {
    mockUseUserPlan.mockReturnValue({
      currentPlan: 'plus' as const,
      hasPlus: true,
    });

    const { result } = renderHook(() => useFreeMessages());

    expect(result.current.messagesRemaining).toBe(Number.POSITIVE_INFINITY);
    expect(result.current.hasReachedLimit).toBe(false);
    expect(result.current.canSendMessage).toBe(true);
  });

  it('should register messages correctly', () => {
    const { result } = renderHook(() => useFreeMessages());

    act(() => {
      result.current.registerMessage();
      result.current.registerMessage();
    });

    expect(result.current.messagesUsed).toBe(2);
    expect(result.current.messagesRemaining).toBe(3);
  });

  it('should not register messages for PLUS users', () => {
    mockUseUserPlan.mockReturnValue({
      currentPlan: 'plus' as const,
      hasPlus: true,
    });

    const { result } = renderHook(() => useFreeMessages());

    act(() => {
      result.current.registerMessage();
    });

    expect(result.current.messagesUsed).toBe(0);
  });

  it('should reset messages when upgrading to PLUS', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      store.incrementMessage('test-user-id');
      store.incrementMessage('test-user-id');
    });

    mockUseUserPlan.mockReturnValue({
      currentPlan: 'free' as const,
      hasPlus: false,
    });

    const { result, rerender } = renderHook(() => useFreeMessages());

    expect(result.current.messagesUsed).toBe(2);

    mockUseUserPlan.mockReturnValue({
      currentPlan: 'plus' as const,
      hasPlus: true,
    });

    rerender(null);

    expect(result.current.messagesUsed).toBe(0);
  });
});
