import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { RecentActivity } from './RecentActivity';

function renderActivity() {
  return render(
    <I18nextProvider i18n={i18n}>
      <RecentActivity />
    </I18nextProvider>,
  );
}

describe('RecentActivity', () => {
  it('renders the section heading', () => {
    renderActivity();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
  });

  it('renders exactly 3 placeholder items', () => {
    renderActivity();
    expect(screen.getAllByTestId('activity-item')).toHaveLength(3);
  });

  it('renders the empty note text', () => {
    renderActivity();
    expect(
      screen.getByText(/activity will appear here once you start invoicing/i),
    ).toBeInTheDocument();
  });
});
