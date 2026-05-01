import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Search } from 'lucide-react';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const statusCor = {'Autorizada':'bg-green-100 text-green-700','Cancelada':'bg-red-100 text-red-700'};

export default function NFeConsulta() {
  const [chave, setChave] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await recordsServiceApi.list('fiscal_nfe');
        if (mounted) setData(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const cards = useMemo(() => {
    return data.slice(0, 50).map((n) => ({
      chave: n.chave,
      numero: n.numero,
      emitente: 'Cozinha ERP',
      destinatario: n.destinatario,
      emissao: n.data_emissao ? new Date(n.data_emissao + 'T00:00').toLocaleDateString('pt-BR') : '—',
      valor: `R$ ${Number(n.valor || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`,
      status: n.status,
    }));
  }, [data]);

  return (
    <div>
      <PageHeader title="Consulta NF-e" breadcrumbs={['Início','Fiscal','NF-e Consulta']}/>
      <div className="bg-white border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted rounded px-3 py-2 flex-1 max-w-xl">
            <Search size={13} className="text-muted-foreground shrink-0"/>
            <input value={chave} onChange={e=>setChave(e.target.value)} placeholder="Informe a chave de acesso (44 dígitos)..."
              className="bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground w-full"/>
          </div>
          <button className="px-4 py-2 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Consultar</button>
        </div>
      </div>
      <div className="bg-white border border-border rounded-lg divide-y divide-border">
        <div className="px-4 py-2.5 border-b border-border"><h3 className="text-sm font-semibold">Notas Emitidas — Abril 2026</h3></div>
        {cards.map((n,i)=>(
          <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-nomus-blue-light text-xs">
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{n.numero} — {n.destinatario}</div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{n.chave}</div>
            </div>
            <div className="text-muted-foreground shrink-0">{n.emissao}</div>
            <div className="font-medium shrink-0">{n.valor}</div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${statusCor[n.status]}`}>{n.status}</span>
          </div>
        ))}
        {!loading && cards.length === 0 && (
          <div className="px-4 py-6 text-xs text-muted-foreground text-center">Nenhuma NF-e cadastrada</div>
        )}
      </div>
    </div>
  );
}