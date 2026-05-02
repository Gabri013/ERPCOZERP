import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Menu, Bell, Search, ChevronDown, Settings, LogOut, HelpCircle, Users, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/lib/AuthContext';
import { useRealtimeNotifications } from '@/lib/RealtimeContext';
import { usePermissao } from '@/lib/PermissaoContext';
import { PERFIS_LABELS } from '@/lib/perfis';
import { primaryRole } from '@/lib/rolePriority';
import { roleCodeToPerfilUxKey } from '@/lib/roleToPerfil';
import { api } from '@/services/api';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

function getAvatarFromName(name) {
  const initials = String(name || 'US')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.replace(/[^A-Za-zÀ-ÿ]/g, ''))
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || 'US';
}

function getPerfilLabel(perfil) {
  return PERFIS_LABELS[perfil] || perfil || 'Usuário';
}

function timeAgo(dateValue) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function Header({ onMenuToggle }) {
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const searchInputRef = useRef(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchHits, setSearchHits] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { usuarioAtual, pode, iniciarImpersonate, impersonando } = usePermissao();
  const { notifRevision } = useRealtimeNotifications();

  useEffect(() => {
    let mounted = true;

    const loadUsersForSwitch = async () => {
      try {
        // Só carrega lista de usuários se puder gerenciar/impersonar (evita 403 em perfis comuns)
        const isMaster = Boolean(user?.roles?.includes('master'));
        if (!isMaster && !pode('gerenciar_usuarios')) {
          if (mounted) setTodosUsuarios([]);
          return;
        }

        const response = await api.get('/api/users?limit=200');
        const body = response?.data;
        const rows = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
        const mapped = rows
          .filter(u => Boolean(u.active))
          .map((u) => {
            const role = primaryRole(u.roles);
            const perfil = roleCodeToPerfilUxKey(role);
            const nome = u.full_name || u.email || 'Usuário';

            return {
              id: u.id,
              nome,
              email: u.email,
              perfil,
              ativo: Boolean(u.active),
              avatar: getAvatarFromName(nome),
            };
          });

        if (mounted) {
          setTodosUsuarios(mapped);
        }
      } catch (err) {
        if (mounted) setTodosUsuarios([]);
      }
    };

    loadUsersForSwitch();
    return () => {
      mounted = false;
    };
  }, [pode, user?.roles]);

  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      try {
        const res = await api.get('/api/notifications/me?limit=20');
        const items = (res?.data?.items || []).map((n) => ({
          id: n.id,
          text: n.text,
          time: timeAgo(n.created_at),
          type: n.type || 'info',
          sector: n.sector || '',
          read: Boolean(n.read),
        }));
        if (mounted) setNotifications(items);
      } catch {
        if (mounted) setNotifications([]);
      }
    };
    loadNotifications();
    const t = window.setInterval(loadNotifications, 120_000);
    return () => {
      mounted = false;
      window.clearInterval(t);
    };
  }, [notifRevision]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isCtrlOrMetaK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (!isCtrlOrMetaK) return;

      event.preventDefault();
      setSearchOpen(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQ('');
      setSearchHits(null);
      setSearchLoading(false);
    }
  }, [searchOpen]);

  useEffect(() => {
    const q = searchQ.trim();
    if (!searchOpen || q.length < 2) {
      setSearchHits(null);
      setSearchLoading(false);
      return undefined;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        setSearchLoading(true);
        try {
          const res = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
          const payload = res?.data?.data;
          if (!cancelled) setSearchHits(payload || null);
        } catch {
          if (!cancelled) {
            setSearchHits(null);
            toast.error('Falha na busca global.');
          }
        } finally {
          if (!cancelled) setSearchLoading(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [searchOpen, searchQ]);

  const navigationItems = useMemo(() => ([
    { label: 'Dashboard', to: '/', shortcut: 'G D' },
    { label: 'Clientes', to: '/vendas/clientes', shortcut: 'G C', can: () => true },
    { label: 'Produtos', to: '/estoque/produtos', shortcut: 'G P', can: () => true },
    { label: 'Ordens de Compra', to: '/compras/ordens-compra', shortcut: 'G O', can: () => true },
    { label: 'Ordens de Produção', to: '/producao/ordens', shortcut: 'G R', can: () => true },
    { label: 'Apontamento', to: '/producao/apontamento', shortcut: 'G A', can: () => pode('apontar') },
    { label: 'Usuários', to: '/configuracoes/usuarios', shortcut: 'G U', can: () => pode('gerenciar_usuarios') },
    { label: 'Configurações da Empresa', to: '/configuracoes/empresa', shortcut: 'G E', can: () => pode('editar_config') },
    { label: 'Ajuda', to: '/ajuda', shortcut: 'G H' },
  ]), [pode]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAllNotificationsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    void api.post('/api/notifications/read-all', {});
  };

  const markNotificationRead = (id) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    void api.post(`/api/notifications/${id}/read`, {});
  };

  const nomeExibido =
    (impersonando?.nome || impersonando?.full_name || impersonando?.email) ||
    (usuarioAtual?.nome || user?.full_name || user?.email || 'Usuário');
  const perfilBase =
    impersonando?.perfil ??
    usuarioAtual?.perfil ??
    roleCodeToPerfilUxKey(primaryRole(user?.roles)) ??
    user?.role ??
    'visualizador';
  const perfilExibido = getPerfilLabel(perfilBase);

  return (
    <header className="bg-white border-b border-border h-11 flex items-center px-2 sm:px-4 gap-2 sm:gap-3 shrink-0 z-10">
      <button
        type="button"
        onClick={onMenuToggle}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-0.5"
        aria-label="Alternar menu lateral"
      >
        <Menu size={18} />
      </button>

      {/* Search (desktop) */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden md:flex items-center gap-2 bg-muted rounded px-3 py-1.5 flex-1 max-w-md text-left"
        aria-label="Buscar (Ctrl+K)"
      >
        <Search size={13} className="text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground flex-1 truncate">
          Buscar pedidos, produtos, clientes...
        </span>
        <span className="text-[10px] text-muted-foreground bg-border px-1 rounded shrink-0">Ctrl+K</span>
      </button>

      {/* Search (mobile icon) */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Buscar"
      >
        <Search size={16} />
      </button>

      <div className="flex-1" />

      {/* Demo: Trocar usuário (apenas para demonstração) */}
      {pode('impersonate') && (
        <div className="relative">
          <button
            type="button"
            onClick={() => { setSwitchOpen(!switchOpen); setUserOpen(false); setNotifOpen(false); }}
            className="flex items-center gap-1.5 text-xs border border-border rounded px-2 sm:px-2.5 py-1 hover:bg-muted transition-colors text-muted-foreground"
            title="Ver como outro usuário"
          >
            <Eye size={13} /> <span className="hidden sm:inline">Ver como</span>
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
                  <div className="w-5 h-5 cozinha-blue-bg rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">{u.avatar}</div>
                  <div>
                    <div className="font-medium">{u.nome}</div>
                    <div className="text-[10px] text-muted-foreground">{getPerfilLabel(u.perfil)}</div>
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
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 cozinha-blue-bg text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-1 w-[min(100vw-1rem,18rem)] sm:w-72 bg-white border border-border rounded-lg shadow-lg z-50 max-h-[70vh] overflow-y-auto">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold">Notificações</span>
              <button
                onClick={markAllNotificationsRead}
                className="text-[10px] text-primary cursor-pointer hover:underline"
              >
                Marcar todas como lidas
              </button>
            </div>
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`px-3 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-0 ${n.read ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.type === 'danger' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : 'bg-success'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${n.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {n.sector ? `${n.sector} • ` : ''}{n.time} atrás
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="px-3 py-2 text-center">
              <button
                onClick={() => setNotifOpen(false)}
                className="text-xs text-primary cursor-pointer hover:underline"
              >
                Ver todas
              </button>
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
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${impersonando ? 'bg-orange-500' : 'cozinha-blue-bg'}`}>
            {getAvatarFromName(nomeExibido)}
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
            <button
              type="button"
              onClick={() => { setUserOpen(false); navigate('/ajuda'); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
            >
              <HelpCircle size={13} className="text-muted-foreground" /> Ajuda
            </button>
            <div className="border-t border-border mt-1 pt-1">
              <button
                type="button"
                onClick={async () => { setUserOpen(false); await logout(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-destructive"
              >
                <LogOut size={13} /> Sair
              </button>
            </div>
          </div>
        )}
      </div>

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        shouldFilter={searchQ.trim().length < 2}
      >
        <CommandInput
          placeholder="Buscar pedidos, produtos, clientes, OPs…"
          ref={searchInputRef}
          value={searchQ}
          onValueChange={setSearchQ}
        />
        <CommandList>
          {searchQ.trim().length >= 2 && (
            <>
              {searchLoading && (
                <div className="py-4 text-center text-xs text-muted-foreground">Buscando…</div>
              )}
              {!searchLoading && searchHits && (
                <>
                  {(searchHits.products?.length > 0) && (
                    <CommandGroup heading="Produtos">
                      {searchHits.products.map((item) => (
                        <CommandItem
                          key={`p-${item.id}`}
                          value={`prod-${item.title}-${item.subtitle}`}
                          onSelect={() => {
                            setSearchOpen(false);
                            navigate(item.href);
                          }}
                        >
                          <span className="truncate">{item.title}</span>
                          <span className="ml-2 truncate text-[11px] text-muted-foreground">{item.subtitle}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {(searchHits.saleOrders?.length > 0) && (
                    <CommandGroup heading="Pedidos de venda">
                      {searchHits.saleOrders.map((item) => (
                        <CommandItem
                          key={`so-${item.id}`}
                          value={`ped-${item.title}`}
                          onSelect={() => {
                            setSearchOpen(false);
                            navigate(item.href);
                          }}
                        >
                          <span className="font-medium">{item.title}</span>
                          <span className="ml-2 text-[11px] text-muted-foreground truncate">{item.subtitle}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {(searchHits.customers?.length > 0) && (
                    <CommandGroup heading="Clientes">
                      {searchHits.customers.map((item) => (
                        <CommandItem
                          key={`c-${item.id}`}
                          value={`cli-${item.title}`}
                          onSelect={() => {
                            setSearchOpen(false);
                            navigate(item.href);
                          }}
                        >
                          {item.title}
                          <span className="ml-2 text-[11px] text-muted-foreground">{item.subtitle}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {(searchHits.workOrders?.length > 0) && (
                    <CommandGroup heading="Ordens de produção">
                      {searchHits.workOrders.map((item) => (
                        <CommandItem
                          key={`wo-${item.id}`}
                          value={`op-${item.title}`}
                          onSelect={() => {
                            setSearchOpen(false);
                            navigate(item.href);
                          }}
                        >
                          <span className="font-medium">{item.title}</span>
                          <span className="ml-2 text-[11px] text-muted-foreground truncate">{item.subtitle}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {!searchLoading && (
                    <CommandEmpty>
                      {!searchHits.products?.length &&
                      !searchHits.saleOrders?.length &&
                      !searchHits.customers?.length &&
                      !searchHits.workOrders?.length
                        ? 'Nenhum resultado para esta busca.'
                        : null}
                    </CommandEmpty>
                  )}
                </>
              )}
            </>
          )}

          {searchQ.trim().length < 2 && (
            <>
              <CommandEmpty>Digite pelo menos 2 caracteres para buscar dados, ou escolha abaixo.</CommandEmpty>
              <CommandGroup heading="Navegação">
                {navigationItems
                  .filter((item) => (typeof item.can === 'function' ? item.can() : true))
                  .map((item) => (
                    <CommandItem
                      key={item.to}
                      value={item.label}
                      onSelect={() => {
                        setSearchOpen(false);
                        navigate(item.to);
                      }}
                    >
                      {item.label}
                      {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Ações">
                <CommandItem
                  value="Marcar notificações como lidas"
                  onSelect={() => {
                    markAllNotificationsRead();
                    setSearchOpen(false);
                  }}
                >
                  Marcar notificações como lidas
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}