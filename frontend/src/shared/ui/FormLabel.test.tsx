import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormLabel } from './FormLabel';

describe('FormLabel', () => {
  it('renders the label text', () => {
    render(<FormLabel>Email address</FormLabel>);
    expect(screen.getByText('Email address')).toBeInTheDocument();
  });

  it('renders a <label> element', () => {
    render(<FormLabel>Username</FormLabel>);
    expect(screen.getByText('Username').tagName).toBe('LABEL');
  });

  it('forwards htmlFor to the label element', () => {
    render(<FormLabel htmlFor="user-email">Email</FormLabel>);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'user-email');
  });

  it('does not render asterisk when required is not set', () => {
    render(<FormLabel>Optional Field</FormLabel>);
    // The aria-hidden asterisk should not be present
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders an aria-hidden asterisk when required=true', () => {
    render(<FormLabel required>Required Field</FormLabel>);
    // The asterisk element is aria-hidden
    const asterisk = document.querySelector('[aria-hidden="true"]');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk?.textContent).toBe('*');
  });

  it('applies the foreground token class', () => {
    render(<FormLabel>Styled Label</FormLabel>);
    const label = screen.getByText('Styled Label');
    // The class should include text-sm and font-medium
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('merges custom className', () => {
    render(<FormLabel className="extra-class">My Label</FormLabel>);
    expect(screen.getByText('My Label')).toHaveClass('extra-class');
  });
});
