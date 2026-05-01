/** Logs só em desenvolvimento — evita ruído no console em produção. */
export function devLog(...args) {
  if (import.meta.env?.DEV) {
     
    console.log(...args);
  }
}

export function devWarn(...args) {
  if (import.meta.env?.DEV) {
     
    console.warn(...args);
  }
}
