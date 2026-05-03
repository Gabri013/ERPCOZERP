import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar.jsx';

vi.mock('@/lib/PermissaoContext', () => ({
  usePermissao: () => ({
    pode: () => true,
    permissoes: ['ver_pedidos', 'ver_estoque', 'ver_op', 'ver_financeiro', 'relatorios:view'],
  }),
}));

vi.mock('@/stores/metadataStore', () => ({
  useMetadataStore: (sel) => {
    const state = { loadEntities: vi.fn(), entities: [] };
    // Support both selector function and direct usage
    if (typeof sel === 'function') return sel(state);
    return state;
  },
}));

// Mock localStorage for sidebar group state
beforeEach(() => {
  localStorage.clear();
});

function renderSidebar(isOpen = true) {
  const setIsOpen = vi.fn();
  const onNavigate = vi.fn();
  const result = render(
    <BrowserRouter>
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} onNavigate={onNavigate} />
    </BrowserRouter>
  );
  return { setIsOpen, onNavigate, ...result };
}

describe('Sidebar Component', () => {
  it('renderiza o logo COZINCA quando expandido', () => {
    renderSidebar(true);
    expect(screen.getByText('COZINCA')).toBeTruthy();
  });

  it('mostra seção OPERACIONAL quando expandido', () => {
    renderSidebar(true);
    expect(screen.getByText('OPERACIONAL')).toBeTruthy();
  });

  it('mostra seção GESTÃO quando expandido', () => {
    renderSidebar(true);
    expect(screen.getByText('GESTÃO')).toBeTruthy();
  });

  it('mostra item Dashboard', () => {
    renderSidebar(true);
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('chama setIsOpen(false) ao clicar no botão recolher', () => {
    const { setIsOpen } = renderSidebar(true);
    const closeBtn = screen.getByLabelText('Recolher menu');
    fireEvent.click(closeBtn);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  it('mostra botão expandir quando recolhido', () => {
    renderSidebar(false);
    expect(screen.getByLabelText('Expandir menu')).toBeTruthy();
  });

  it('chama setIsOpen(true) ao clicar no botão expandir', () => {
    const { setIsOpen } = renderSidebar(false);
    const openBtn = screen.getByLabelText('Expandir menu');
    fireEvent.click(openBtn);
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });

  it('expande grupo Vendas ao clicar', () => {
    renderSidebar(true);
    const vendasBtn = screen.getByText('Vendas');
    fireEvent.click(vendasBtn);
    expect(screen.getByText('Pedidos de Venda')).toBeTruthy();
  });

  it('expande grupo Estoque ao clicar', () => {
    renderSidebar(true);
    const estoqueBtn = screen.getByText('Estoque');
    fireEvent.click(estoqueBtn);
    expect(screen.getByText('Produtos')).toBeTruthy();
  });

  it('colapsa grupo ao clicar novamente', () => {
    renderSidebar(true);
    const vendasBtn = screen.getByText('Vendas');
    fireEvent.click(vendasBtn); // abre
    expect(screen.getByText('Pedidos de Venda')).toBeTruthy();
    fireEvent.click(vendasBtn); // fecha
    expect(screen.queryByText('Pedidos de Venda')).toBeNull();
  });

  it('mostra versão no rodapé', () => {
    renderSidebar(true);
    expect(screen.getByText(/v2\.6\.0/)).toBeTruthy();
  });
});
