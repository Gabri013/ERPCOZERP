import { useEffect, useState } from 'react';
import { metaCodeApi } from '@/services/metaCodeApi';

let cache = null;
let cachePromise = null;

async function loadCategories() {
  if (cache) return cache;
  if (cachePromise) return cachePromise;
  cachePromise = metaCodeApi
    .listCategories()
    .then((rows) => {
      cache = rows;
      return rows;
    })
    .catch(() => {
      cache = [];
      return [];
    })
    .finally(() => {
      cachePromise = null;
    });
  return cachePromise;
}

/** Invalida cache após edição em Configurações. */
export function invalidateIndustrialCategoryCache() {
  cache = null;
}

export default function IndustrialCategoryBadge({ code, className = '' }) {
  const [cats, setCats] = useState(cache || []);

  useEffect(() => {
    let ok = true;
    loadCategories().then((rows) => {
      if (ok) setCats(rows);
    });
    return () => {
      ok = false;
    };
  }, []);

  const c = cats.find((x) => String(x.code).toUpperCase() === String(code || '').toUpperCase());
  if (!code || !c) return null;

  return (
    <span
      className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${className}`}
      style={{ backgroundColor: c.color, color: c.textColor }}
      title={c.label}
    >
      {c.code}
    </span>
  );
}
