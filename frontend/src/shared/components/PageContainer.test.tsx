import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('PageContainer', () => {
  it('renders children', async () => {
    const { PageContainer } = await import('./PageContainer');
    render(
      <PageContainer>
        <span data-testid="child">Hello</span>
      </PageContainer>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('uses motion.div when reduced motion is not preferred', async () => {
    const { PageContainer } = await import('./PageContainer');
    const { container } = render(
      <PageContainer>
        <span>content</span>
      </PageContainer>,
    );
    // framer-motion renders a div; check it contains the content
    expect(container.firstChild).toBeTruthy();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders plain div when reduced motion is preferred', async () => {
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
    const { PageContainer } = await import('./PageContainer');
    const { container } = render(
      <PageContainer>
        <span data-testid="child-rm">content</span>
      </PageContainer>,
    );
    // Should be a plain div, no framer data attributes
    expect(container.firstChild?.nodeName).toBe('DIV');
    expect(screen.getByTestId('child-rm')).toBeInTheDocument();
  });

  it('accepts additional className', async () => {
    const { PageContainer } = await import('./PageContainer');
    const { container } = render(
      <PageContainer className="extra-class">
        <span>content</span>
      </PageContainer>,
    );
    expect(container.firstChild).toHaveClass('extra-class');
  });
});
