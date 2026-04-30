import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Download, Printer } from 'lucide-react';
import { opService } from '@/services/opService';
import { apontamentoService } from '@/services/apontamentoService';
import ApontamentoModal from '@/components/producao/ApontamentoModal';
import { PodeRender } from '@/lib/PermissaoContext';
import { exportPdfReport } from '@/services/pdfExport';
import FluxoProducao from '@/components/producao/FluxoProducao';

const ETAPAS_FLUXO = [
  'Programação','Engenharia','Corte a Laser','Retirada','Rebarbação',
  'Dobra','Solda','Montagem','Acabamento','Qualidade','Embalagem','Expedição'
];

const STATUS_LABEL = {
  aberta: 'Aberta', em_andamento: 'Em Andamento', pausada: 'Pausada', concluida: 'Concluída', cancelada: 'Cancelada'
};
const STATUS_COR = {
  aberta:'bg-blue-100 text-blue-700', em_andamento:'bg-orange-100 text-orange-700',
  pausada:'bg-yellow-100 text-yellow-700', concluida:'bg-green-100 text-green-700', cancelada:'bg-red-100 text-red-700'
};

function Timeline({ apontamentos }) {
  const concluidas = new Set(apontamentos.filter(a=>a.status==='Finalizado').map(a=>a.etapa));
  const emAndamento = apontamentos.find(a=>a.status==='Em Andamento')?.etapa;
  return (
    <div className="relative">
      <div className="flex items-start gap-0 overflow-x-auto pb-4">
        {ETAPAS_FLUXO.map((etapa, i) => {
          const ok = concluidas.has(etapa);
          const ativo = emAndamento === etapa;
          return (
            <div key={etapa} className="flex flex-col items-center min-w-[80px]">
              <div className="flex items-center w-full">
                {i > 0 && <div className={`h-0.5 flex-1 ${ok ? 'bg-green-500' : 'bg-border'}`}/>}
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 
                  ${ok ? 'bg-green-500 border-green-500 text-white' : ativo ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-border text-muted-foreground'}`}>
                  {ok ? '✓' : i+1}
                </div>
                {i < ETAPAS_FLUXO.length - 1 && <div className={`h-0.5 flex-1 ${ok ? 'bg-green-500' : 'bg-border'}`}/>}
              </div>
              <div className={`text-[9px] text-center mt-1.5 font-medium leading-tight max-w-[70px] ${ativo?'text-orange-600':ok?'text-green-600':'text-muted-foreground'}`}>
                {etapa}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DetalheOP() {
  const { id } = useParams();
  const [op, setOp] = useState(null);
  const [apontamentos, setApontamentos] = useState([]);
  const [aba, setAba] = useState('dados');
  const [showApontamento, setShowApontamento] = useState(false);
  const [revisoes, setRevisoes] = useState([
    { id:1, data:'2026-04-15', prazoAnterior:'2026-04-20', novoPrazo:'2026-04-25', motivo:'Atraso no fornecimento de matéria-prima', responsavel:'Maria L.' }
  ]);

  useEffect(() => {
    opService.getById(id).then(r => setOp(r.data));
    apontamentoService.getByOpId(id).then(r => setApontamentos(r.data));
  }, [id]);

  const handleSalvarApontamento = async (dados) => {
    await apontamentoService.iniciar(id, dados);
    // Recarrega OP e apontamentos (status pode ter mudado)
    const [updatedOp, updatedApts] = await Promise.all([
      opService.getById(id),
      apontamentoService.getByOpId(id),
    ]);
    setOp(updatedOp.data);
    setApontamentos(updatedApts.data);
  };

  const handleImprimir = () => window.print();

  const handleExportarPDF = () => {
    exportPdfReport({
      title: `Ordem de Produção ${op.numero}`,
      subtitle: op.clienteNome,
      filename: `${op.numero}.pdf`,
      fields: [
        { label: 'Nº OP', value: op.numero },
        { label: 'Cliente', value: op.clienteNome },
        { label: 'Produto', value: op.produtoDescricao },
        { label: 'Quantidade', value: `${op.quantidade} ${op.unidade}` },
        { label: 'Emissão', value: fmt(op.dataEmissao) },
        { label: 'Prazo', value: fmt(op.prazo) },
        { label: 'Responsável', value: op.responsavel || '—' },
        { label: 'Status', value: statusLabel },
      ],
      sections: [
        {
          title: 'Observações',
          fields: [
            { label: 'Observação', value: op.observacao || 'Nenhuma observação' },
            { label: 'Info. Complementar', value: op.informacaoComplementar || '—' },
          ],
        },
      ],
      table: {
        headers: ['Etapa', 'Operador', 'Setor', 'Início', 'Fim', 'Qtd', 'Refugo', 'Status', 'Obs'],
        rows: apontamentos.map((a) => [
          a.etapa,
          a.operador,
          a.setor,
          a.horaInicio ? new Date(a.horaInicio).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—',
          a.horaFim ? new Date(a.horaFim).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—',
          a.quantidade ?? '—',
          a.refugo ?? '—',
          a.status,
          a.observacao || '—',
        ]),
      },
      preview: true,
    });
  };

  if (!op) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const statusLabel = STATUS_LABEL[op.status] || op.status;
  const statusCls = STATUS_COR[op.status] || 'bg-gray-100 text-gray-600';
  const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const abas = [
    { key:'dados', label:'Dados Gerais' },
    { key:'processo', label:'Processo' },
    { key:'apontamentos', label:`Apontamentos (${apontamentos.length})` },
    { key:'revisoes', label:`Revisão de Prazo (${revisoes.length})` },
  ];

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/producao/ordens" className="flex items-center gap-1 text-xs text-primary hover:underline">
          <ArrowLeft size={13}/> Ordens de Produção
        </Link>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs font-semibold">{op.numero}</span>
      </div>

      <FluxoProducao title="Fluxo da Ordem de Produção" />

      {/* Card resumo */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
            <div><div className="text-[10px] text-muted-foreground">Nº OP</div><div className="text-sm font-bold text-primary">{op.numero}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Cliente</div><div className="text-sm font-semibold">{op.clienteNome}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Produto</div><div className="text-sm font-semibold">{op.produtoDescricao}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Quantidade</div><div className="text-sm font-bold">{op.quantidade} {op.unidade}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Emissão</div><div className="text-xs">{fmt(op.dataEmissao)}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Prazo</div><div className="text-xs font-semibold text-orange-600">{fmt(op.prazo)}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Responsável</div><div className="text-xs">{op.responsavel||'—'}</div></div>
            <div><div className="text-[10px] text-muted-foreground">Status</div><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusCls}`}>{statusLabel}</span></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <PodeRender acao="apontar">
              <button onClick={()=>setShowApontamento(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90"><Play size={12}/> Apontar</button>
            </PodeRender>
            <button onClick={handleImprimir} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Printer size={12}/> Imprimir</button>
            <button onClick={handleExportarPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={12}/> Exportar PDF</button>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-border mb-4">
        <div className="flex gap-0">
          {abas.map(a=>(
            <button key={a.key} onClick={()=>setAba(a.key)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${aba===a.key?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo das abas */}
      {aba === 'dados' && (
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div><div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Identificação</div>
                <div className="space-y-1.5">
                  {[['Nº OP',op.numero],['Nº Pedido',op.pedidoId||'—'],['Cód. Produto',op.codigoProduto]].map(([k,v])=>(
                    <div key={k} className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Produto</div>
                <div className="space-y-1.5">
                  {[['Descrição',op.produtoDescricao],['Quantidade',`${op.quantidade} ${op.unidade}`]].map(([k,v])=>(
                    <div key={k} className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div><div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Datas</div>
                <div className="space-y-1.5">
                  {[['Emissão',fmt(op.dataEmissao)],['Prazo',fmt(op.prazo)]].map(([k,v])=>(
                    <div key={k} className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Observações</div>
                <div className="text-xs text-foreground bg-muted rounded p-2 min-h-[40px]">{op.observacao||'Nenhuma observação'}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 mt-3">Informação Complementar</div>
                <div className="text-xs text-foreground bg-muted rounded p-2 min-h-[30px]">{op.informacaoComplementar||'—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {aba === 'processo' && (
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-xs font-semibold mb-4">Fluxo de Produção</h3>
          <Timeline apontamentos={apontamentos} />
          <div className="mt-6">
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"/><span>Concluído</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-500"/><span>Em andamento</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-border border-2"/><span>Pendente</span></div>
            </div>
          </div>
        </div>
      )}

      {aba === 'apontamentos' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <h3 className="text-xs font-semibold">Histórico de Apontamentos</h3>
            <PodeRender acao="apontar">
              <button onClick={()=>setShowApontamento(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90"><Play size={11}/> Novo Apontamento</button>
            </PodeRender>
          </div>
          {apontamentos.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">Nenhum apontamento registrado</div>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-muted border-b border-border">
                {['Etapa','Operador','Setor','Início','Fim','Qtd','Refugo','Status','Obs'].map(h=>(
                  <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {apontamentos.map((a,i)=>(
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-nomus-blue-light">
                    <td className="px-3 py-2 font-medium">{a.etapa}</td>
                    <td className="px-3 py-2">{a.operador}</td>
                    <td className="px-3 py-2">{a.setor}</td>
                    <td className="px-3 py-2">{a.horaInicio ? new Date(a.horaInicio).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                    <td className="px-3 py-2">{a.horaFim ? new Date(a.horaFim).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                    <td className="px-3 py-2">{a.quantidade??'—'}</td>
                    <td className="px-3 py-2">{a.refugo??'—'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${a.status==='Finalizado'?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>{a.status}</span>
                    </td>
                    <td className="px-3 py-2 max-w-[120px] truncate">{a.observacao||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {aba === 'revisoes' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <h3 className="text-xs font-semibold">Revisões de Prazo</h3>
            <button className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">+ Nova Revisão</button>
          </div>
          {revisoes.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">Nenhuma revisão registrada</div>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-muted border-b border-border">
                {['Data','Prazo Anterior','Novo Prazo','Motivo','Responsável'].map(h=>(
                  <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {revisoes.map(r=>(
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-nomus-blue-light">
                    <td className="px-4 py-2">{r.data}</td>
                    <td className="px-4 py-2 text-red-600">{r.prazoAnterior}</td>
                    <td className="px-4 py-2 text-green-600 font-medium">{r.novoPrazo}</td>
                    <td className="px-4 py-2">{r.motivo}</td>
                    <td className="px-4 py-2">{r.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showApontamento && <ApontamentoModal op={op} onClose={()=>setShowApontamento(false)} onSave={handleSalvarApontamento}/>}
    </div>
  );
}