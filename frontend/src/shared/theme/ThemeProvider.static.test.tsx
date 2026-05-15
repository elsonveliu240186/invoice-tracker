import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from './ThemeProvider';

describe('ThemeProvider (static import — coverage)', () => {
  it('renders children without crashing', () => {
    const { getByText } = render(
      <ThemeProvider>
        <span>hello</span>
      </ThemeProvider>,
    );
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('unmounts cleanly without throwing', () => {
    const { unmount } = render(
      <ThemeProvider>
        <span>bye</span>
      </ThemeProvider>,
    );
    expect(() => unmount()).not.toThrow();
  });
});
