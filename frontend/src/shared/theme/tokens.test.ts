import { describe, it, expect } from 'vitest';
import { tokens, colors, breakpoints, font, space, radius, shadow, state, cssVars } from './tokens';

describe('tokens', () => {
  it('exports a tokens object with all top-level keys', () => {
    expect(tokens).toHaveProperty('colors');
    expect(tokens).toHaveProperty('cssVars');
    expect(tokens).toHaveProperty('font');
    expect(tokens).toHaveProperty('space');
    expect(tokens).toHaveProperty('radius');
    expect(tokens).toHaveProperty('shadow');
    expect(tokens).toHaveProperty('breakpoints');
    expect(tokens).toHaveProperty('state');
  });

  describe('colors', () => {
    it('has light and dark variants', () => {
      expect(colors).toHaveProperty('light');
      expect(colors).toHaveProperty('dark');
    });

    it('light mode contains all required color roles', () => {
      const required = [
        'background',
        'foreground',
        'primary',
        'primaryForeground',
        'secondary',
        'muted',
        'mutedForeground',
        'accent',
        'destructive',
        'border',
        'input',
        'ring',
      ] as const;
      for (const key of required) {
        expect(colors.light).toHaveProperty(key);
        expect(colors.light[key]).toMatch(/^hsl\(/);
      }
    });

    it('dark mode contains all required color roles', () => {
      const required = [
        'background',
        'foreground',
        'primary',
        'muted',
        'mutedForeground',
        'destructive',
        'border',
        'ring',
      ] as const;
      for (const key of required) {
        expect(colors.dark).toHaveProperty(key);
        expect(colors.dark[key]).toMatch(/^hsl\(/);
      }
    });

    it('dark foreground is light (near-white)', () => {
      // hsl(210 40% 98%) — lightness 98 %
      expect(colors.dark.foreground).toContain('98%');
    });

    it('light foreground is dark (near-black)', () => {
      // hsl(222 47% 11%) — lightness 11 %
      expect(colors.light.foreground).toContain('11%');
    });
  });

  describe('cssVars', () => {
    it('every entry is a CSS var() reference', () => {
      for (const value of Object.values(cssVars)) {
        expect(value).toMatch(/^var\(--color-/);
      }
    });

    it('has foreground and muted-foreground keys', () => {
      expect(cssVars).toHaveProperty('foreground');
      expect(cssVars).toHaveProperty('mutedForeground');
      expect(cssVars).toHaveProperty('destructive');
    });
  });

  describe('font', () => {
    it('has all size keys', () => {
      const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'] as const;
      for (const s of sizes) {
        expect(font.size).toHaveProperty(s);
      }
    });

    it('has weight keys', () => {
      expect(font.weight).toHaveProperty('normal');
      expect(font.weight).toHaveProperty('medium');
      expect(font.weight).toHaveProperty('semibold');
      expect(font.weight).toHaveProperty('bold');
    });
  });

  describe('space', () => {
    it('has common spacing values', () => {
      expect(space[4]).toBe('1rem');
      expect(space[8]).toBe('2rem');
    });
  });

  describe('radius', () => {
    it('has sm, md, lg, full', () => {
      expect(radius).toHaveProperty('sm');
      expect(radius).toHaveProperty('md');
      expect(radius).toHaveProperty('lg');
      expect(radius).toHaveProperty('full');
    });
  });

  describe('shadow', () => {
    it('has sm, md, lg keys', () => {
      expect(shadow).toHaveProperty('sm');
      expect(shadow).toHaveProperty('md');
      expect(shadow).toHaveProperty('lg');
    });
  });

  describe('breakpoints', () => {
    it('has the four standard breakpoints', () => {
      expect(breakpoints.sm).toBe(640);
      expect(breakpoints.md).toBe(768);
      expect(breakpoints.lg).toBe(1024);
      expect(breakpoints.xl).toBe(1280);
    });
  });

  describe('state', () => {
    it('has all five component state keys', () => {
      expect(state).toHaveProperty('default');
      expect(state).toHaveProperty('hover');
      expect(state).toHaveProperty('focusVisible');
      expect(state).toHaveProperty('disabled');
      expect(state).toHaveProperty('error');
    });

    it('error state references the destructive token', () => {
      expect(state.error).toContain('--color-destructive');
    });

    it('focusVisible state references the ring token', () => {
      expect(state.focusVisible).toContain('--color-ring');
    });
  });
});
