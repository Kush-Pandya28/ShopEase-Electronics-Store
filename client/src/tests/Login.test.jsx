import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { createStore } from '../app/store';
import Login from '../pages/Login';

const renderLogin = () =>
  render(
    <Provider store={createStore()}>
      <HelmetProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </HelmetProvider>
    </Provider>
  );

describe('Login form', () => {
  test('shows validation errors for empty submit', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  test('fills demo customer credentials', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /demo customer account/i }));
    expect(screen.getByLabelText('Email')).toHaveValue('customer@shopease.com');
  });

  test('fields start empty and read-only so a saved login is not auto-filled', () => {
    renderLogin();
    for (const label of ['Email', 'Password']) {
      const input = screen.getByLabelText(label);
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('readonly');
    }
  });

  test('has Login / Sign up tabs and a way to create an account', () => {
    renderLogin();
    expect(screen.getByRole('navigation', { name: /login or create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a new account' })).toHaveAttribute('href', '/register');
  });
});
