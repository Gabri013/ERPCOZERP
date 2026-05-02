import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Download, Printer, Package, Tag, Plus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { opService } from '@/services/opService';
import { apontamentoService } from '@/services/apontamentoService';
import { api } from '@/services/api';
import ApontamentoModal from '@/components/producao/ApontamentoModal';
import { PodeRender, usePermissao } from '@/lib/PermissaoContext';
import { exportOrdemProducaoModelo, exportPdfReport } from '@/services/pdfExport';
import FluxoProducao from '@/components/producao/FluxoProducao';
import { productsApi } from '@/services/productsApi';

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
  const { usuarioVisivel } = usePermissao();
  const [op, setOp] = useState(null);
  const [apontamentos, setApontamentos] = useState([]);
  const [aba, setAba] = useState('dados');
  const [showApontamento, setShowApontamento] = useState(false);
  const [revisoes, setRevisoes] = useState([]);
  const [opFiles, setOpFiles] = useState([]);
  const [bomData, setBomData] = useState(null); // { lines, bomStatus }
  const [requisicoes, setRequisicoes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [showReporte, setShowReporte] = useState(false);
  const [qtdReporte, setQtdReporte] = useState(1);
  const [loteReporte, setLoteReporte] = useState('');
  const [refugoReporte, setRefugoReporte] = useState(0);
  const [showEtiqueta, setShowEtiqueta] = useState(false);
  const [qtdEtiquetas, setQtdEtiquetas] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const opRes = await opService.getById(id);
      if (!mounted) return;
      setOp(opRes.data);
      const opNumero = opRes.data?.numero || id;
      try {
        const aptsRes = await apontamentoService.getByOpId(opNumero);
        if (!mounted) return;
        setApontamentos(aptsRes.data || []);
      } catch {
        if (!mounted) return;
        setApontamentos([]);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let ok = true;
    (async () => {
      try {
        const f = await productsApi.filesForOp(id);
        if (ok) setOpFiles(Array.isArray(f) ? f : []);
      } catch {
        if (ok) setOpFiles([]);
      }
    })();
    return () => { ok = false; };
  }, [id]);

  // Load BOM when op is loaded
  useEffect(() => {
    if (!op?.codigoProduto) return;
    let ok = true;
    (async () => {
      try {
        const bom = await productsApi.bomForProductCode(op.codigoProduto);
        if (ok) setBomData(bom || null);
      } catch {
        if (ok) setBomData(null);
      }
    })();
    return () => { ok = false; };
  }, [op?.codigoProduto]);

  // Load requisicoes for this OP
  useEffect(() => {
    if (!id) return;
    let ok = true;
    (async () => {
      try {
        const res = await api.get(`/api/production/requisitions?opId=${id}`);
        if (ok) setRequisicoes(res.data?.data ?? res.data ?? []);
      } catch {
        if (ok) setRequisicoes([]);
      }
    })();
    return () => { ok = false; };
  }, [id]);

  const roles = usuarioVisivel?.roles || [];
  const setorInfo = (() => {
    if (roles.includes('corte_laser')) return { defaultSetor: 'Laser', setores: ['Laser'] };
    if (roles.includes('dobra_montagem')) return { defaultSetor: 'Dobra', setores: ['Dobra', 'Montagem'] };
    if (roles.includes('solda')) return { defaultSetor: 'Solda', setores: ['Solda'] };
    if (roles.includes('qualidade')) return { defaultSetor: 'Qualidade', setores: ['Qualidade'] };
    if (roles.includes('expedicao')) return { defaultSetor: 'Expedição', setores: ['Expedição'] };
    if (roles.includes('gerente_producao')) return { defaultSetor: 'Programação', setores: null };
    return { defaultSetor: '', setores: null };
  })();

  const handleSalvarApontamento = async (dados) => {
    await apontamentoService.iniciar(op?.numero || id, dados);
    // Recarrega OP e apontamentos (status pode ter mudado)
    const [updatedOp, updatedApts] = await Promise.all([
      opService.getById(id),
      apontamentoService.getByOpId(op?.numero || id),
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

  const handleExportarPDFModelo = () => {
    exportOrdemProducaoModelo({
      op,
      apontamentos,
      filename: `${op.numero}-modelo.pdf`,
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

  const bomLineCount = bomData?.lines?.length ?? 0;
  const abas = [
    { key:'dados', label:'Dados Gerais' },
    { key:'processo', label:'Processo' },
    { key:'apontamentos', label:`Apontamentos (${apontamentos.length})` },
    { key:'bom', label:`BOM (${bomLineCount})` },
    { key:'requisicao', label:`Requisição (${requisicoes.length})` },
    { key:'reporte', label:`Reporte (${reportes.length})` },
    { key:'etiquetas', label:'Etiquetas' },
    { key:'arquivos', label:`Arquivos (${opFiles.length})` },
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
            <button onClick={handleExportarPDFModelo} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={12}/> PDF (Modelo)</button>
            <button onClick={handleExportarPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={12}/> PDF (Detalhado)</button>
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

      {aba === 'bom' && (
        <div className="bg-white border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold">Lista de Materiais (BOM)</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Estrutura do produto <span className="font-mono">{op.codigoProduto}</span>
                {bomData?.bomStatus && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    bomData.bomStatus === 'COMPLETE' ? 'bg-green-100 text-green-700' :
                    bomData.bomStatus === 'PENDING_ENGINEERING' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {bomData.bomStatus}
                  </span>
                )}
              </p>
            </div>
          </div>

          {(!bomData || bomData.lines?.length === 0) ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              BOM não cadastrada para este produto. Acesse Engenharia → Projetos para importar.
            </p>
          ) : (
            <div className="overflow-x-auto rounded border border-border">
              <table className="min-w-[640px] w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Descrição</th>
                    <th className="p-2 text-left">Material</th>
                    <th className="p-2 text-left">Processo</th>
                    <th className="p-2 text-right">Qtd</th>
                    <th className="p-2 text-right">Peso kg</th>
                  </tr>
                </thead>
                <tbody>
                  {bomData.lines.map((l, i) => (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-mono font-medium">{l.componentCode}</td>
                      <td className="p-2 text-muted-foreground max-w-[140px] truncate">{l.description || '—'}</td>
                      <td className="p-2 text-muted-foreground max-w-[120px] truncate">{l.materialSpec || '—'}</td>
                      <td className="p-2">
                        {l.process ? (
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            l.process === 'ALMOXARIFADO' ? 'bg-blue-100 text-blue-700' :
                            l.process === 'LASER' ? 'bg-orange-100 text-orange-700' :
                            l.process === 'DOBRA' ? 'bg-purple-100 text-purple-700' :
                            l.process === 'SOLDA' ? 'bg-red-100 text-red-700' :
                            l.process === 'MONTAGEM' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {l.process}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-2 text-right font-medium">{Number(l.quantity)}</td>
                      <td className="p-2 text-right text-muted-foreground">
                        {l.weightKg ? Number(l.weightKg).toFixed(3) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {aba === 'arquivos' && (
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Cópias de DXF/PDF do produto, disponíveis após a geração automática desta OP a partir do pedido.
          </p>
          {opFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum arquivo vinculado a esta ordem.</p>
          ) : (
            <ul className="space-y-2">
              {opFiles.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-xs border border-border rounded px-3 py-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{f.tipo}</span>
                  <span className="truncate flex-1">{f.nomeOriginal}</span>
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => productsApi.openFileInNewTab(f.id)}
                  >
                    Abrir
                  </button>
                </li>
              ))}
            </ul>
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

      {/* ABA REQUISIÇÃO */}
      {aba === 'requisicao' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <h3 className="text-xs font-semibold">Requisições de Materiais</h3>
            <Link to="/producao/requisicao" className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted">
              <Package size={11}/> Gerir Requisições
            </Link>
          </div>
          {requisicoes.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Nenhuma requisição gerada. <Link to="/producao/requisicao" className="text-primary underline">Gerar requisição</Link>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-muted border-b border-border">
                {['Requisição','Data','Itens','Operador','Status'].map(h=>(
                  <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {requisicoes.map(r=>(
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 font-mono font-semibold text-primary">{r.id}</td>
                    <td className="px-4 py-2">{r.data}</td>
                    <td className="px-4 py-2">{r.itens} itens</td>
                    <td className="px-4 py-2">{r.operador}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${r.status==='Requisitado'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ABA REPORTE */}
      {aba === 'reporte' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <h3 className="text-xs font-semibold">Reporte de Produção</h3>
            <button onClick={() => setShowReporte(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90">
              <Plus size={11}/> Registrar Produção
            </button>
          </div>
          {reportes.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Nenhum reporte registrado. Clique em "Registrar Produção" para iniciar.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="bg-muted border-b border-border">
                {['Data','Qtd Produzida','Refugo','Lote','Operador'].map(h=>(
                  <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {reportes.map((r,i)=>(
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">{new Date(r.data).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                    <td className="px-4 py-2 font-bold text-green-700">{r.qtd} {op.unidade}</td>
                    <td className="px-4 py-2 text-red-600">{r.refugo > 0 ? r.refugo : '—'}</td>
                    <td className="px-4 py-2 font-mono">{r.lote || '—'}</td>
                    <td className="px-4 py-2">{r.operador}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ABA ETIQUETAS */}
      {aba === 'etiquetas' && (
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold mb-3">Emissão de Etiquetas de Identificação</h3>
          <div className="border-2 border-dashed border-border rounded-lg p-5 font-mono text-xs bg-gray-50 max-w-xs mx-auto mb-4">
            <div className="text-center mb-2">
              <div className="text-sm font-bold uppercase">{op.produtoDescricao}</div>
              <div className="text-muted-foreground">Cód: {op.codigoProduto}</div>
            </div>
            <div className="border-t border-border pt-2 grid grid-cols-2 gap-1 text-[10px]">
              <div><span className="text-muted-foreground">OP:</span> {op.numero}</div>
              <div><span className="text-muted-foreground">Qtd:</span> 1 pcs</div>
              <div><span className="text-muted-foreground">Cliente:</span> {op.clienteNome}</div>
              <div><span className="text-muted-foreground">Data:</span> {new Date().toLocaleDateString('pt-BR')}</div>
            </div>
            <div className="mt-2 flex justify-center">
              <div className="bg-gray-200 w-32 h-8 flex items-center justify-center text-[9px] text-muted-foreground rounded">[Código de Barras]</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs font-medium">Quantidade de etiquetas:</label>
            <input type="number" min="1" max="100" className="erp-input w-20 text-xs" value={qtdEtiquetas} onChange={(e) => setQtdEtiquetas(Number(e.target.value))} />
          </div>
          <button onClick={() => { setShowEtiqueta(true); setTimeout(() => setShowEtiqueta(false), 100); import('sonner').then(m => m.toast.success(`${qtdEtiquetas} etiqueta(s) enviada(s) para impressão!`)); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-white rounded hover:opacity-90">
            <Printer size={12}/> Imprimir {qtdEtiquetas} Etiqueta(s)
          </button>
          <p className="text-[10px] text-muted-foreground mt-2">Layout personalizável · Suporte ZEBRA, ARGOX, TSC</p>
        </div>
      )}

      {/* Modal Reporte */}
      {showReporte && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div><h2 className="font-semibold text-sm">Registrar Produção</h2><p className="text-xs text-muted-foreground">{op.numero}</p></div>
              <button onClick={() => setShowReporte(false)}><XCircle size={16}/></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="erp-label">Qtd. Produzida *</label>
                <input type="number" min="0" className="erp-input w-full text-lg font-bold" value={qtdReporte} onChange={(e) => setQtdReporte(Number(e.target.value))} />
              </div>
              <div>
                <label className="erp-label">Refugo / Rejeitos</label>
                <input type="number" min="0" className="erp-input w-full" value={refugoReporte} onChange={(e) => setRefugoReporte(Number(e.target.value))} />
              </div>
              <div className="col-span-2">
                <label className="erp-label">Lote de Rastreabilidade</label>
                <input className="erp-input w-full font-mono" placeholder="Ex: LT-2025-0055" value={loteReporte} onChange={(e) => setLoteReporte(e.target.value)} />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button onClick={() => setShowReporte(false)} className="erp-btn-ghost text-xs">Cancelar</button>
              <button onClick={() => {
                setReportes([...reportes, { data: new Date().toISOString(), qtd: qtdReporte, refugo: refugoReporte, lote: loteReporte, operador: 'Usuário Atual' }]);
                setShowReporte(false); setQtdReporte(1); setLoteReporte(''); setRefugoReporte(0);
                import('sonner').then(m => m.toast.success('Reporte registrado! Estoque atualizado.'));
              }} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:opacity-90">
                <CheckCircle size={12}/> Salvar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {showApontamento && (
        <ApontamentoModal
          op={op}
          defaultSetor={setorInfo.defaultSetor}
          setores={setorInfo.setores}
          onClose={() => setShowApontamento(false)}
          onSave={handleSalvarApontamento}
        />
      )}
    </div>
  );
}