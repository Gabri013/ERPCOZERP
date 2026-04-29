import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FilterBar from '@/components/common/FilterBar';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ModalProduto from '@/components/estoque/ModalProduto';
import DetalheModal from '@/components/common/DetalheModal';
import { Plus, Download, AlertTriangle } from 'lucide-react';
import { storage } from '@/services/storage';
import { exportPdfReport } from '@/services/pdfExport';

const MOCK_INICIAL = [
  { id:'1', codigo:'PRD-001', descricao:'Eixo Transmissão 25mm', grupo:'Eixos', unidade:'UN', preco_custo:45.50, preco_venda:89.90, estoque_atual:120, estoque_minimo:50, tipo:'Produto', status:'Ativo', localizacao:'A1-B2' },
  { id:'2', codigo:'PRD-002', descricao:'Rolamento 6205-ZZ', grupo:'Rolamentos', unidade:'UN', preco_custo:8.20, preco_venda:18.50, estoque_atual:15, estoque_minimo:30, tipo:'Produto', status:'Ativo', localizacao:'B3-C1' },
  { id:'3', codigo:'PRD-003', descricao:'Chapa Aço 3mm 1000x2000', grupo:'Chapas', unidade:'PC', preco_custo:320.00, preco_venda:480.00, estoque_atual:45, estoque_minimo:10, tipo:'Matéria-Prima', status:'Ativo', localizacao:'C5' },
  { id:'4', codigo:'PRD-004', descricao:'Parafuso M8x30 DIN 933', grupo:'Fixadores', unidade:'CX', preco_custo:12.50, preco_venda:28.00, estoque_atual:200, estoque_minimo:100, tipo:'Produto', status:'Ativo', localizacao:'D2' },
  { id:'5', codigo:'PRD-005', descricao:'Motor Elétrico 1CV', grupo:'Motores', unidade:'UN', preco_custo:580.00, preco_venda:950.00, estoque_atual:8, estoque_minimo:5, tipo:'Produto', status:'Ativo', localizacao:'E1' },
  { id:'6', codigo:'PRD-006', descricao:'Correia V-B52', grupo:'Correias', unidade:'UN', preco_custo:22.00, preco_venda:45.00, estoque_atual:3, estoque_minimo:20, tipo:'Produto', status:'Ativo', localizacao:'F3' },
  { id:'7', codigo:'SRV-001', descricao:'Usinagem CNC por hora', grupo:'Serviços', unidade:'H', preco_custo:0, preco_venda:120.00, estoque_atual:0, estoque_minimo:0, tipo:'Serviço', status:'Ativo', localizacao:'' },
];

if (!localStorage.getItem('nomus_erp_produtos')) storage.set('produtos', MOCK_INICIAL);
const getData = () => storage.get('produtos', MOCK_INICIAL);
const saveData = d => storage.set('produtos', d);
const fmtR = v => v ? `R$ ${Number(v).toFixed(2).replace('.',',')}` : '—';

export default function Produtos() {
  const [data, setData] = useState(getData());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  const reload = () => setData([...getData()]);

  const handleSave = (form) => {
    const all = getData();
    if (editando) {
      saveData(all.map(p => p.id === editando.id ? {...editando,...form} : p));
    } else {
      const codigo = form.tipo === 'Serviço' ? `SRV-${String(all.filter(p=>p.tipo==='Serviço').length+2).padStart(3,'0')}` : `PRD-${String(all.filter(p=>p.tipo!=='Serviço').length+2).padStart(3,'0')}`;
      saveData([{...form, id:Date.now().toString(), codigo}, ...all]);
    }
    reload();
    setEditando(null);
  };

  const filtered = data.filter(p => {
    const s = search.toLowerCase();
    return (!s || p.descricao?.toLowerCase().includes(s) || p.codigo?.toLowerCase().includes(s))
      && (!filters.tipo || p.tipo === filters.tipo)
      && (!filters.status || p.status === filters.status);
  });

  const semEstoque = data.filter(p => Number(p.estoque_atual) < Number(p.estoque_minimo)).length;

  const columns = [
    { key:'codigo', label:'Código', width:90 },
    { key:'descricao', label:'Descrição', render:(v,row)=><button className="text-primary hover:underline text-left" onClick={e=>{e.stopPropagation();setDetalhe(row)}}>{v}</button> },
    { key:'grupo', label:'Grupo', width:100 },
    { key:'tipo', label:'Tipo', width:100 },
    { key:'unidade', label:'UN', width:50 },
    { key:'preco_custo', label:'Custo', width:90, render:fmtR },
    { key:'preco_venda', label:'Venda', width:90, render:fmtR },
    { key:'estoque_atual', label:'Estoque', width:80, render:(v,row)=>(
      <span className={Number(v)<Number(row.estoque_minimo)?'text-destructive font-semibold flex items-center gap-1':''}>
        {Number(v)<Number(row.estoque_minimo)&&<AlertTriangle size={11}/>}{v}
      </span>
    )},
    { key:'estoque_minimo', label:'Mín.', width:60 },
    { key:'status', label:'Status', width:70, render:v=><StatusBadge status={v}/>, sortable:false },
  ];

  return (
    <div>
      <PageHeader title="Produtos" breadcrumbs={['Início','Estoque','Produtos']}
        actions={
          <div className="flex gap-2">
            <button onClick={()=>exportPdfReport({
              title: 'Produtos',
              subtitle: 'Catálogo de itens, serviços e matérias-primas',
              filename: 'produtos.pdf',
              table: {
                headers: ['Código', 'Descrição', 'Grupo', 'Tipo', 'UN', 'Custo', 'Venda', 'Estoque', 'Mín.', 'Status'],
                rows: getData().map((produto) => [
                  produto.codigo,
                  produto.descricao,
                  produto.grupo,
                  produto.tipo,
                  produto.unidade,
                  fmtR(produto.preco_custo),
                  fmtR(produto.preco_venda),
                  produto.estoque_atual,
                  produto.estoque_minimo,
                  produto.status,
                ]),
              },
            })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Download size={13}/> Exportar PDF</button>
            <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90"><Plus size={13}/> Novo Produto</button>
          </div>
        }
      />
      {semEstoque > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3 text-xs text-red-700">
          <AlertTriangle size={13}/><strong>{semEstoque} produto(s)</strong> com estoque abaixo do mínimo
        </div>
      )}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <FilterBar search={search} onSearch={setSearch}
          filters={[
            {key:'tipo',label:'Tipo',options:['Produto','Serviço','Matéria-Prima','Semi-Acabado'].map(s=>({value:s,label:s}))},
            {key:'status',label:'Status',options:['Ativo','Inativo'].map(s=>({value:s,label:s}))},
          ]}
          activeFilters={filters} onFilterChange={(k,v)=>setFilters(f=>({...f,[k]:v}))} onClear={()=>{setSearch('');setFilters({});}}
        />
        <DataTable columns={columns} data={filtered} onRowClick={row=>setDetalhe(row)}/>
      </div>

      {(showModal || editando) && (
        <ModalProduto produto={editando} onClose={()=>{setShowModal(false);setEditando(null);}} onSave={handleSave}/>
      )}

      {detalhe && (
        <DetalheModal title={detalhe.descricao} subtitle={`${detalhe.codigo} · ${detalhe.tipo}`} onClose={()=>setDetalhe(null)} onExport={()=>exportPdfReport({
          title: detalhe.descricao,
          subtitle: `${detalhe.codigo} · ${detalhe.tipo}`,
          filename: `${detalhe.codigo}.pdf`,
          fields: [
            { label: 'Código', value: detalhe.codigo },
            { label: 'Grupo', value: detalhe.grupo },
            { label: 'Unidade', value: detalhe.unidade },
            { label: 'Status', value: detalhe.status },
            { label: 'Custo', value: fmtR(detalhe.preco_custo) },
            { label: 'Venda', value: fmtR(detalhe.preco_venda) },
            { label: 'Estoque Atual', value: detalhe.estoque_atual },
            { label: 'Estoque Mín.', value: detalhe.estoque_minimo },
            { label: 'Localização', value: detalhe.localizacao || '—' },
            { label: 'NCM', value: detalhe.ncm || '—' },
          ],
          preview: true,
        })}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Código',detalhe.codigo],['Grupo',detalhe.grupo],['Unidade',detalhe.unidade],['Status',detalhe.status],['Custo',fmtR(detalhe.preco_custo)],['Venda',fmtR(detalhe.preco_venda)],['Estoque Atual',detalhe.estoque_atual],['Estoque Mín.',detalhe.estoque_minimo],['Localização',detalhe.localizacao||'—'],['NCM',detalhe.ncm||'—']].map(([k,v])=>(
              <div key={k} className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={()=>{setEditando(detalhe);setDetalhe(null);}} className="px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90">Editar</button>
          </div>
        </DetalheModal>
      )}
    </div>
  );
}