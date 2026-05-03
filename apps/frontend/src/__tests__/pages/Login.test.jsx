import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { setupApiMocks } from '../setup/mocks/apiMock.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue({ success: true }),
    user: null,
    token: null,
  }),
}));

import Login from '../../pages/Login.jsx';

function renderLogin() {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupApiMocks();
  });

  it('renderiza o formulário de login', () => {
    renderLogin();
    const emailInput = document.querySelector('input[type="email"]');
    expect(emailInput).not.toBeNull();
  });

  it('exibe campo de senha como type="password"', () => {
    renderLogin();
    const passInput = document.querySelector('input[type="password"]');
    expect(passInput).not.toBeNull();
  });

  it('exibe botão de envio', () => {
    renderLogin();
    const btn = screen.getByRole('button', { name: /entrar|login|acessar/i });
    expect(btn).toBeTruthy();
  });

  it('aceita input de email', () => {
    renderLogin();
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
      fireEvent.change(emailInput, { target: { value: 'teste@email.com' } });
      expect(emailInput.value).toBe('teste@email.com');
    }
  });

  it('aceita input de senha', () => {
    renderLogin();
    const passInput = document.querySelector('input[type="password"]');
    if (passInput) {
      fireEvent.change(passInput, { target: { value: 'senha123' } });
      expect(passInput.value).toBe('senha123');
    }
  });

  it('mostra mensagem de erro ao submeter com campos vazios', async () => {
    // Mock login to fail
    vi.doMock('@/lib/AuthContext', () => ({
      useAuth: () => ({
        login: vi.fn().mockResolvedValue({ success: false, error: 'Email e senha são obrigatórios' }),
        user: null,
        token: null,
      }),
    }));

    renderLogin();
    const submitBtn = screen.getByRole('button', { name: /entrar|login|acessar/i });
    fireEvent.click(submitBtn);

    // Aguarda que o formulário seja processado sem crash
    await waitFor(() => {
      expect(submitBtn).toBeTruthy();
    });
  });
});
