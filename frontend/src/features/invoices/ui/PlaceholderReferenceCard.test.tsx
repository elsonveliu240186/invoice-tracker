import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { PlaceholderReferenceCard } from './PlaceholderReferenceCard';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderCard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <PlaceholderReferenceCard />
    </I18nextProvider>,
  );
}

describe('PlaceholderReferenceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the card', () => {
    renderCard();
    expect(screen.getByTestId('placeholder-reference-card')).toBeInTheDocument();
  });

  it('renders copy buttons for placeholders', () => {
    renderCard();
    const buttons = screen.getAllByTestId('placeholder-copy-btn');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders company placeholder', () => {
    renderCard();
    expect(screen.getByText('{{company.name}}')).toBeInTheDocument();
  });

  it('renders client placeholder', () => {
    renderCard();
    expect(screen.getByText('{{client.name}}')).toBeInTheDocument();
  });

  it('renders invoice placeholder', () => {
    renderCard();
    expect(screen.getByText('{{invoice.number}}')).toBeInTheDocument();
  });

  it('renders lines placeholder', () => {
    renderCard();
    expect(screen.getByText('{{#lines}}')).toBeInTheDocument();
  });

  it('shows success toast when copy button is clicked', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderCard();
    const buttons = screen.getAllByTestId('placeholder-copy-btn');
    await user.click(buttons[0]!);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('shows different success toast for each distinct copy button click', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderCard();
    const buttons = screen.getAllByTestId('placeholder-copy-btn');
    await user.click(buttons[0]!);
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    await user.click(buttons[1]!);
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(2));
  });
});
