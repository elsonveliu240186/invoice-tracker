import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders the label text', () => {
    render(
      <FormField id="test-field" label="Email address">
        <input id="test-field" type="email" />
      </FormField>,
    );
    expect(screen.getByText('Email address')).toBeInTheDocument();
  });

  it('renders the children (control slot)', () => {
    render(
      <FormField id="test-input" label="Name">
        <input id="test-input" type="text" data-testid="ctrl" />
      </FormField>,
    );
    expect(screen.getByTestId('ctrl')).toBeInTheDocument();
  });

  it('wires label htmlFor to the provided id', () => {
    render(
      <FormField id="my-email" label="Email">
        <input id="my-email" type="email" />
      </FormField>,
    );
    // getByLabelText uses htmlFor → id association
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('does not render an error paragraph when error is not provided', () => {
    render(
      <FormField id="no-err" label="Field">
        <input id="no-err" />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the error message with role="alert" when error is set', () => {
    render(
      <FormField id="err-field" label="Password" error="Password is required">
        <input id="err-field" type="password" />
      </FormField>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Password is required');
  });

  it('error paragraph id matches <id>-error pattern', () => {
    render(
      <FormField id="pw-field" label="Password" error="Too short">
        <input id="pw-field" type="password" />
      </FormField>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('id', 'pw-field-error');
  });

  it('wraps content in a container with data-testid="form-field"', () => {
    render(
      <FormField id="ff" label="Label">
        <input id="ff" />
      </FormField>,
    );
    expect(screen.getByTestId('form-field')).toBeInTheDocument();
  });

  it('passes required prop to FormLabel (shows asterisk)', () => {
    render(
      <FormField id="req-field" label="Required" required>
        <input id="req-field" />
      </FormField>,
    );
    // The aria-hidden asterisk should be present
    const asterisk = document.querySelector('[aria-hidden="true"]');
    expect(asterisk?.textContent).toBe('*');
  });

  it('merges custom className onto the wrapper', () => {
    render(
      <FormField id="cls-field" label="Label" className="mt-8">
        <input id="cls-field" />
      </FormField>,
    );
    expect(screen.getByTestId('form-field')).toHaveClass('mt-8');
  });
});
