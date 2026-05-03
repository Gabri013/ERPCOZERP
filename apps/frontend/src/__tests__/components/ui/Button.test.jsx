import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../components/ui/button.jsx';

describe('Button Component', () => {
  it('renderiza com texto', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeTruthy();
  });

  it('chama onClick ao ser clicado', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clique</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fica desabilitado quando disabled=true', () => {
    render(<Button disabled>Botão</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('não dispara onClick quando desabilitado', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Botão</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renderiza variante destructive com classe correta', () => {
    render(<Button variant="destructive">Excluir</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/destructive/i);
  });

  it('renderiza variante outline', () => {
    render(<Button variant="outline">Cancelar</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('aplica className extra', () => {
    render(<Button className="minha-classe">OK</Button>);
    expect(screen.getByRole('button').className).toContain('minha-classe');
  });

  it('renderiza type="submit" corretamente', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
