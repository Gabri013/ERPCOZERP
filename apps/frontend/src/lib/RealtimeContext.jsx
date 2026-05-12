import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { appConfig } from '@/config/appConfig';
import { useAuth } from '@/lib/AuthContext';
import { rolesCanSeeNotificationSector } from '@/lib/notificationVisibility';

const RealtimeContext = createContext({
  socket: null,
  notifRevision: 0,
  bumpNotifications: () => {},
});

/** Em produção (nginx) o websocket usa o mesmo origin; em dev usa URL do backend direto. */
function socketBaseUrl() {
  if (!appConfig.isApi) return '';
  if (import.meta.env.DEV) {
    return (appConfig.backendUrl || 'http://127.0.0.1:3001').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin;
  const base = (appConfig.backendUrl || '').replace(/\/$/, '');
  return base || '';
}

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [notifRevision, setNotifRevision] = useState(0);

  const bumpNotifications = useCallback(() => setNotifRevision((n) => n + 1), []);

  useEffect(() => {
    if (!appConfig.isApi || !user) return undefined;
    if (import.meta.env.VITE_DISABLE_REALTIME === 'true') return undefined;

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token') || localStorage.getItem('token')
        : null;

    if (!token) return undefined;

    const url = socketBaseUrl();
    const dev = import.meta.env.DEV;
    const socket = io(url || undefined, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      // Em dev, reconexão infinita dispara o proxy do Vite contra :3001 quando o API está off — polui o terminal.
      ...(dev && {
        reconnectionAttempts: 12,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 30000,
      }),
    });

    const onNv = () => {
      toast.info('Novo apontamento de produção');
      bumpNotifications();
    };

    const onOp = () => {
      toast.warning('Ordem de produção em atraso');
      bumpNotifications();
    };

    const onNvNotif = (payload) => {
      const roles = user?.roles || [];
      if (!rolesCanSeeNotificationSector(payload?.sector, roles)) return;
      toast.info(payload?.text || 'Nova notificação');
      bumpNotifications();
    };

    socket.on('connect_error', () => {
      logSocketDebugError();
    });

    socket.on('novo_apontamento', onNv);
    socket.on('op_atrasada', onOp);
    socket.on('notification_broadcast', onNvNotif);
    socket.on('notification', onNvNotif);

    return () => {
      socket.off('novo_apontamento', onNv);
      socket.off('op_atrasada', onOp);
      socket.off('notification_broadcast', onNvNotif);
      socket.off('notification', onNvNotif);
      socket.disconnect();
    };
  }, [user, bumpNotifications]);

  const value = useMemo(
    () => ({ socket: null, notifRevision, bumpNotifications }),
    [notifRevision, bumpNotifications],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

function logSocketDebugError() {
  if (import.meta.env?.DEV && import.meta.env?.VITE_SOCKET_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.warn('[socket] falha ao conectar (modo debug)');
  }
}

export function useRealtimeNotifications() {
  return useContext(RealtimeContext);
}
