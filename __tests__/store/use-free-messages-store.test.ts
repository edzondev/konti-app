import { act } from '@testing-library/react-native';
import { useFreeMessagesStore } from '@/store/use-free-messages-store';

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(() => null),
    remove: jest.fn(),
  })),
}));

describe('useFreeMessagesStore', () => {
  beforeEach(() => {
    const store = useFreeMessagesStore.getState();
    Object.keys(store.messagesUsed).forEach((userId) => {
      store.resetMessages(userId);
    });
  });

  it('should return 0 for new user', () => {
    const store = useFreeMessagesStore.getState();
    expect(store.getMessagesUsed('user-1')).toBe(0);
  });

  it('should increment and get messages correctly', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      store.incrementMessage('user-1');
      store.incrementMessage('user-1');
    });

    expect(store.getMessagesUsed('user-1')).toBe(2);
  });

  it('should handle multiple users independently', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      store.incrementMessage('user-1');
      store.incrementMessage('user-2');
    });

    expect(store.getMessagesUsed('user-1')).toBe(1);
    expect(store.getMessagesUsed('user-2')).toBe(1);
  });

  it('should reset messages for specific user', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      store.incrementMessage('user-1');
      store.incrementMessage('user-2');
      store.resetMessages('user-1');
    });

    expect(store.getMessagesUsed('user-1')).toBe(0);
    expect(store.getMessagesUsed('user-2')).toBe(1);
  });

  it('should detect limit correctly', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      for (let i = 0; i < 4; i++) {
        store.incrementMessage('user-1');
      }
    });

    expect(store.hasReachedLimit('user-1')).toBe(false);

    act(() => {
      store.incrementMessage('user-1');
    });

    expect(store.hasReachedLimit('user-1')).toBe(true);
  });
});
