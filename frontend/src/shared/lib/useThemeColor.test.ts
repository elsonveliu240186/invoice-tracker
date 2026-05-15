import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useThemeColor } from './useThemeColor';

describe('useThemeColor', () => {
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;
  let mutationCallback: MutationCallback | null = null;

  beforeEach(() => {
    disconnectSpy = vi.fn();
    observeSpy = vi.fn();

    vi.stubGlobal(
      'MutationObserver',
      vi.fn((cb: MutationCallback) => {
        mutationCallback = cb;
        return { observe: observeSpy, disconnect: disconnectSpy };
      }),
    );

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (_: string) => ' #FCA311',
    } as unknown as CSSStyleDeclaration);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    mutationCallback = null;
  });

  it('returns the trimmed CSS variable value on mount', () => {
    const { result } = renderHook(() => useThemeColor('--color-accent'));
    expect(result.current).toBe('#FCA311');
  });

  it('starts observing document.documentElement for class changes', () => {
    renderHook(() => useThemeColor('--color-accent'));
    expect(observeSpy).toHaveBeenCalledWith(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  });

  it('updates color when mutation fires', () => {
    let callCount = 0;
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: () => (callCount++ === 0 ? ' #FCA311' : ' #14213D'),
        }) as unknown as CSSStyleDeclaration,
    );

    const { result } = renderHook(() => useThemeColor('--color-accent'));
    expect(result.current).toBe('#FCA311');

    act(() => {
      mutationCallback?.([], {} as MutationObserver);
    });

    expect(result.current).toBe('#14213D');
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = renderHook(() => useThemeColor('--color-accent'));
    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
