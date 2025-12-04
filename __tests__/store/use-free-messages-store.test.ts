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
    store.resetMessages();
  });

  it('should return 0 for new device', () => {
    const store = useFreeMessagesStore.getState();
    expect(store.getMessagesUsed()).toBe(0);
  });

  it('should increment and get messages correctly', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      store.incrementMessage();
      store.incrementMessage();
    });

    expect(store.getMessagesUsed()).toBe(2);
  });

  it('should reset messages for device', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      store.incrementMessage();
      store.incrementMessage();
      store.resetMessages();
    });

    expect(store.getMessagesUsed()).toBe(0);
  });

  it('should detect limit correctly', () => {
    const store = useFreeMessagesStore.getState();

    act(() => {
      for (let i = 0; i < 4; i++) {
        store.incrementMessage();
      }
    });

    expect(store.hasReachedLimit()).toBe(false);

    act(() => {
      store.incrementMessage();
    });

    expect(store.hasReachedLimit()).toBe(true);
  });
});
