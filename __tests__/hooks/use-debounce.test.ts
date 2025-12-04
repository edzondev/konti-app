import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '@/hooks/use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes with default delay', () => {
    const { result, rerender } = renderHook(
      (props: { value: string }) => useDebounce(props.value, 500),
      { initialProps: { value: 'initial' } },
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast forward 499ms - still shouldn't update
    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // Fast forward 1 more ms (total 500ms)
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should use custom delay', () => {
    const { result, rerender } = renderHook(
      (props: { value: string; delay: number }) =>
        useDebounce(props.value, props.delay),
      { initialProps: { value: 'initial', delay: 1000 } },
    );

    rerender({ value: 'updated', delay: 1000 });

    // Value should not change at 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // Value should change at 1000ms
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      (props: { value: string }) => useDebounce(props.value, 500),
      { initialProps: { value: 'initial' } },
    );

    rerender({ value: 'first' });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender({ value: 'second' });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender({ value: 'third' });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Only 300ms passed since last change, should still be initial
    expect(result.current).toBe('initial');

    // Complete the final timer
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('third');
  });

  it('should work with different value types', () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      (props: { value: number }) => useDebounce(props.value, 500),
      { initialProps: { value: 0 } },
    );

    numberRerender({ value: 42 });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(numberResult.current).toBe(42);

    // Test with object
    const { result: objectResult, rerender: objectRerender } = renderHook(
      (props: { value: { name: string } }) => useDebounce(props.value, 500),
      { initialProps: { value: { name: 'initial' } } },
    );

    const newObject = { name: 'updated' };
    objectRerender({ value: newObject });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(objectResult.current).toEqual({ name: 'updated' });
  });

  it('should work with null and undefined values', () => {
    const { result, rerender } = renderHook(
      (props: { value: string | null }) =>
        useDebounce<string | null>(props.value, 500),
      { initialProps: { value: 'initial' as string | null } },
    );

    rerender({ value: null });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBeNull();
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(
      (props: { value: string }) => useDebounce(props.value, 500),
      { initialProps: { value: 'initial' } },
    );

    rerender({ value: 'updated' });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
