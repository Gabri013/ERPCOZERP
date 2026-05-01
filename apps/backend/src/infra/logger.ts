const prod = process.env.NODE_ENV === 'production';

/** Log apenas em desenvolvimento (evita poluir stdout em produção). */
export function logDebug(message: string, meta?: unknown) {
  if (prod) return;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console.log(message, meta);
  } else {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}

export function logInfo(message: string, meta?: unknown) {
  if (prod) return;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console.info(message, meta);
  } else {
    // eslint-disable-next-line no-console
    console.info(message);
  }
}
