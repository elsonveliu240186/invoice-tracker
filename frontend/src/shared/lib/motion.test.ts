import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('motion variants', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('fadeIn has hidden and visible states', async () => {
    const { fadeIn } = await import('./motion');
    expect(fadeIn).toHaveProperty('hidden');
    expect(fadeIn).toHaveProperty('visible');
    expect(fadeIn.hidden).toMatchObject({ opacity: 0 });
    expect((fadeIn.visible as Record<string, unknown>)['opacity']).toBe(1);
  });

  it('slideUp has hidden and visible states', async () => {
    const { slideUp } = await import('./motion');
    expect(slideUp).toHaveProperty('hidden');
    expect(slideUp).toHaveProperty('visible');
    expect((slideUp.hidden as Record<string, unknown>)['opacity']).toBe(0);
  });

  it('staggerChildren has hidden and visible states', async () => {
    const { staggerChildren } = await import('./motion');
    expect(staggerChildren).toHaveProperty('hidden');
    expect(staggerChildren).toHaveProperty('visible');
  });

  it('pageTransition has initial, animate and exit states', async () => {
    const { pageTransition } = await import('./motion');
    expect(pageTransition).toHaveProperty('initial');
    expect(pageTransition).toHaveProperty('animate');
    expect(pageTransition).toHaveProperty('exit');
  });

  it('prefersReducedMotion returns false when matchMedia does not match', async () => {
    const { prefersReducedMotion } = await import('./motion');
    expect(prefersReducedMotion()).toBe(false);
  });

  it('prefersReducedMotion returns true when matchMedia matches', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.resetModules();
    const { prefersReducedMotion } = await import('./motion');
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when window is undefined', async () => {
    const origWindow = globalThis.window;
    // @ts-expect-error intentional
    delete globalThis.window;
    vi.resetModules();
    const { prefersReducedMotion } = await import('./motion');
    expect(prefersReducedMotion()).toBe(false);
    globalThis.window = origWindow;
  });
});
