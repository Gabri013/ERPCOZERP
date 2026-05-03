/**
 * Corrige texto onde UTF-8 foi interpretado como Latin-1 (mojibake).
 * Ex.: "OrÃ§amento" → "Orçamento". Só altera se detectar o padrão com "Ã" (U+00C3).
 */
export function repairUtf8Mojibake(str) {
  if (typeof str !== 'string' || !str.includes('\u00C3')) return str;
  try {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c > 255) return str;
      bytes[i] = c;
    }
    const out = new TextDecoder('utf-8').decode(bytes);
    if (out.includes('\uFFFD')) return str;
    return out;
  } catch {
    return str;
  }
}
