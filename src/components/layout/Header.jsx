const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { Menu, Bell, Search, ChevronDown, Settings, LogOut, HelpCircle, Users, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/lib/AuthContext';
import { usePermissao } from '@/lib/PermissaoContext';
import { userService } from '@/services/userService';
import { PERFIS_LABELS } from '@/lib/perfis';

export default function Header({ onMenuToggle }) {
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const { user } = useAuth();
  const { usuarioAtual, usuarioVisivel, pode, trocarUsuario, iniciarImpersonate, impersonando } = usePermissao();

  const todosUsuarios = userService.getAll().filter(u => u.ativo);

  const notifications = [
    { id: 1, text: '3 pedidos aguardando aprovação', time: '5 min', type: 'warning' },
    { id: 2, text: 'Estoque baixo: Rolamento 6205-ZZ', time: '1h', type: 'danger' },
    { id: 3, text: 'OP #0542 concluída com sucesso', time: '2h', type: 'success' },
    { id: 4, text: 'Conta a pagar vencendo amanhã: R$ 3.840', time: '3h', type: 'warning' },
  ];

  const nomeExibido = impersonando ? impersonando.nome : (usuarioAtual?.nome || user?.full_name || 'Usuário');
  const perfilExibido = impersonando ? PERFIS_LABELS[impersonando.perfil] : (usuarioAtual ? PERFIS_LABELS[usuarioAtual.perfil] : (user?.role || 'Admin'));

  return (
    <header className="bg-white border-b border-border h-11 flex items-center px-4 gap-3 shrink-0 z-10">
      <button onClick={onMenuToggle} className="text-muted-foreground hover:text-foreground transition-colors">
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="flex items-center gap-2 bg-muted rounded px-3 py-1.5 flex-1 max-w-md">
        <Search size={13} className="text-muted-foreground shrink-0" />
        <input
          placeholder="Buscar pedidos, produtos, clientes..."
          className="bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground w-full"
        />
        <span className="text-[10px] text-muted-foreground bg-border px-1 rounded">Ctrl+K</span>
      </div>

      <div className="flex-1" />

      {/* Demo: Trocar usuário (apenas para demonstração) */}
      {pode('impersonate') && (
        <div className="relative">
          <button
            onClick={() => { setSwitchOpen(!switchOpen); setUserOpen(false); setNotifOpen(false); }}
            className="flex items-center gap-1.5 text-xs border border-border rounded px-2.5 py-1 hover:bg-muted transition-colors text-muted-foreground"
            title="Ver como outro usuário"
          >
            <Eye size={13} /> Ver como
          </button>
          {switchOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-lg z-50 py-1">
              <div className="px-3 py-1.5 border-b border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Ver sistema como...</p>
              </div>
              {todosUsuarios.map(u => (
                <button
                  key={u.id}
                  onClick={() => { iniciarImpersonate(u.id); setSwitchOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left ${impersonando?.id === u.id ? 'bg-orange-50 text-orange-700' : ''}`}
                >
                  <div className="w-5 h-5 nomus-blue-bg rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">{u.avatar}</div>
                  <div>
                    <div className="font-medium">{u.nome}</div>
                    <div className="text-[10px] text-muted-foreground">{PERFIS_LABELS[u.perfil]}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); setSwitchOpen(false); }}
          className="relative text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <Bell size={16} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 nomus-blue-bg text-white text-[9px] rounded-full flex items-center justify-center font-bold">
            {notifications.length}
          </span>
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-border rounded-lg shadow-lg z-50">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold">Notificações</span>
              <span className="text-[10px] text-primary cursor-pointer hover:underline">Marcar todas como lidas</span>
            </div>
            {notifications.map(n => (
              <div key={n.id} className="px-3 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-0">
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.type === 'danger' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : 'bg-success'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time} atrás</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="px-3 py-2 text-center">
              <span className="text-xs text-primary cursor-pointer hover:underline">Ver todas</span>
            </div>
          </div>
        )}
      </div>

      {/* User */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); setSwitchOpen(false); }}
          className="flex items-center gap-2 hover:bg-muted rounded px-2 py-1 transition-colors"
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${impersonando ? 'bg-orange-500' : 'nomus-blue-bg'}`}>
            {nomeExibido.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-foreground leading-tight">{nomeExibido}</div>
            <div className="text-[10px] text-muted-foreground">{perfilExibido}</div>
          </div>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
        {userOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-50 py-1">
            <div className="px-3 py-1.5 border-b border-border mb-1">
              <p className="text-xs font-medium">{nomeExibido}</p>
              <p className="text-[10px] text-muted-foreground">{perfilExibido}</p>
            </div>
            {pode('gerenciar_usuarios') && (
              <Link to="/configuracoes/usuarios" onClick={() => setUserOpen(false)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                <Users size={13} className="text-muted-foreground" /> Usuários
              </Link>
            )}
            <Link to="/configuracoes/empresa" onClick={() => setUserOpen(false)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors">
              <Settings size={13} className="text-muted-foreground" /> Configurações
            </Link>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors">
              <HelpCircle size={13} className="text-muted-foreground" /> Ajuda
            </button>
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => db.auth.logout()}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-destructive"
              >
                <LogOut size={13} /> Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}