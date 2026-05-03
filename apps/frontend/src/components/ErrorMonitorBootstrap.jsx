import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { appConfig } from '@/config/appConfig';
import { ingestClientError } from '@/services/errorMonitorApi';

const THROTTLE_MS = 8000;
const dedupe = new Map();

function shouldSend(key) {
  const now = Date.now();
  const last = dedupe.get(key) ?? 0;
  if (now - last < THROTTLE_MS) return false;
  dedupe.set(key, now);
  return true;
}

/**
 * Envia erros do browser para a fila `error_queue` (utilizador autenticado).
 * Não substitui logging em servidor; complementa deteção contínua.
 */
export default function ErrorMonitorBootstrap() {
  const location = useLocation();
  const pathRef = useRef(location.pathname);

  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!appConfig.isApi) return undefined;

    const onWindowError = (ev) => {
      const msg = ev?.message || 'window.error';
      const key = `err:${msg}:${pathRef.current}`;
      if (!shouldSend(key)) return;
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) return;
      void ingestClientError({
        type: 'frontend_console_error',
        severity: 'high',
        description: msg,
        stackTrace: ev?.error?.stack || null,
        route: pathRef.current,
        metadata: { filename: ev?.filename, lineno: ev?.lineno, colno: ev?.colno },
      }).catch(() => {});
    };

    const onRejection = (ev) => {
      const reason = ev?.reason;
      const msg = reason instanceof Error ? reason.message : String(reason ?? 'unhandledrejection');
      const key = `rej:${msg}:${pathRef.current}`;
      if (!shouldSend(key)) return;
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) return;
      void ingestClientError({
        type: 'frontend_console_error',
        severity: 'high',
        description: `Unhandled rejection: ${msg}`,
        stackTrace: reason instanceof Error ? reason.stack : null,
        route: pathRef.current,
      }).catch(() => {});
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
