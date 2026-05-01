import { Link } from 'react-router-dom';

export default function Ajuda() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ajuda</h1>
        <p className="text-muted-foreground text-sm">
          Atalhos e dicas rápidas para usar o ERP.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-white p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Busca rápida</h2>
          <p className="text-sm text-muted-foreground">
            Use <span className="font-medium">Ctrl+K</span> (ou clique no ícone de busca) para abrir a busca global e navegar entre telas.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Notificações</h2>
          <p className="text-sm text-muted-foreground">
            No sino do topo você pode ver e marcar notificações como lidas.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Configurações</h2>
          <p className="text-sm text-muted-foreground">
            Acesse <Link className="text-primary hover:underline" to="/configuracoes/empresa">Configurações</Link> e
            {' '}
            <Link className="text-primary hover:underline" to="/configuracoes/usuarios">Usuários</Link> (se tiver permissão).
          </p>
        </div>
      </div>
    </div>
  );
}

