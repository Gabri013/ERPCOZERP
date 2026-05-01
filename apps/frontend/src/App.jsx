import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/health`)
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) throw new Error(body?.error || `HTTP ${r.status}`);
        if (!cancelled) setHealth(body);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message || e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ margin: 0 }}>ERP COZ (base)</h1>
      <p style={{ color: '#666' }}>Frontend React base — pronto para evoluir para módulos do ERP.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Status da API">
          {error ? (
            <div style={{ color: '#b00020' }}>{error}</div>
          ) : !health ? (
            <div>Carregando...</div>
          ) : (
            <pre style={preStyle}>{JSON.stringify(health, null, 2)}</pre>
          )}
        </Card>
        <Card title="Próximos passos">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Autenticação (JWT)</li>
            <li>Layout e roteamento</li>
            <li>Módulos: Estoque, Produção, Compras, Financeiro</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

const preStyle = {
  margin: 0,
  background: '#0b1020',
  color: '#cfe0ff',
  padding: 12,
  borderRadius: 8,
  overflow: 'auto',
  maxHeight: 280,
};

