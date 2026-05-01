/** Logs só em desenvolvimento — evita ruído no console em produção. */
export function devLog(...args) {
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function devWarn(...args) {
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}
