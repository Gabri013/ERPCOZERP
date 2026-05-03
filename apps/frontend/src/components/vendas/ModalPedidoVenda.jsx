import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { recordsServiceApi } from '@/services/recordsServiceApi';

const CLIENTES = ['Metalúrgica ABC Ltda','Ind. XYZ S/A','Comércio Beta','Grupo Delta','TechParts Ltda','SiderTech S/A'];
const VENDEDORES = ['Carlos Silva','Ana Paula','Rafael Costa'];
const PRODUTOS_LIST = [
  { codigo:'PRD-001', descricao:'Eixo Transmissão 25mm', preco:89.90 },
  { codigo:'PRD-002', descricao:'Rolamento 6205-ZZ', preco:18.50 },
  { codigo:'PRD-003', descricao:'Chapa Aço 3mm', preco:480.00 },
  { codigo:'PRD-004', descricao:'Parafuso M8x30', preco:28.00 },
  { codigo:'PRD-005', descricao:'Motor Elétrico 1CV', preco:950.00 },
];
const FORMAS_PAG = ['À Vista','Boleto 30 dias','Boleto 30/60','Boleto 30/60/90','Cartão','Cheque'];

const EMPTY_ITEM = { produto_codigo:'', produto_descricao:'', quantidade:1, preco_unitario:0, desconto:0 };

const EMPTY_ORCAMENTO = {
  cliente_nome: '',
  vendedor: '',
  data_emissao: new Date().toISOString().slice(0, 10),
  validade: '',
  oportunidade_id: '',
  data_entrega: '',
  forma_pagamento: 'À Vista',
  status: 'Orçamento',
  observacoes: '',
};

const EMPTY_PEDIDO = {
  cliente_nome: '',
  vendedor: '',
  data_emissao: new Date().toISOString().slice(0, 10),
  data_entrega: '',
  forma_pagamento: 'À Vista',
  status: 'Orçamento',
  observacoes: '',
};

export default function ModalPedidoVenda({ pedido, onClose, onSave, moduloOrcamento }) {
  const isEdicao = !!pedido;
  const [form, setForm] = useState(pedido || (moduloOrcamento ? EMPTY_ORCAMENTO : EMPTY_PEDIDO));
  const [opps, setOpps] = useState([]);
  const [itens, setItens] = useState(pedido?.itens || [{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    if (!moduloOrcamento) return;
    let ok = true;
    (async () => {
      try {
        const list = await recordsServiceApi.list('crm_oportunidade');
        if (ok) setOpps(Array.isArray(list) ? list : []);
      } catch {
        if (ok) setOpps([]);
      }
    })();
    return () => { ok = false; };
  }, [moduloOrcamento]);

  const addItem = () => setItens(i=>[...i, {...EMPTY_ITEM}]);
  const removeItem = (idx) => setItens(i=>i.filter((_,j)=>j!==idx));
  const updItem = (idx,k,v) => setItens(i=>i.map((it,j)=>j===idx?{...it,[k]:v}:it));
  const selectProduto = (idx, codigo) => {
    const p = PRODUTOS_LIST.find(x=>x.codigo===codigo);
    if(p) setItens(i=>i.map((it,j)=>j===idx?{...it,produto_codigo:codigo,produto_descricao:p.descricao,preco_unitario:p.preco}:it));
  };

  const total = itens.reduce((sum,it)=>{
    const subtotal = (it.quantidade||0)*(it.preco_unitario||0);
    return sum + subtotal*(1-(it.desconto||0)/100);
  },0);

  const handleSave = async () => {
    if (!form.cliente_nome) return alert('Informe o cliente');
    if (moduloOrcamento && !String(form.oportunidade_id || '').trim()) {
      return alert('Selecione a oportunidade CRM vinculada a este orçamento.');
    }
    setSaving(true);
    const payload = { ...form, itens, valor_total: total };
    if (moduloOrcamento && form.validade) {
      payload.validade = form.validade;
    }
    await onSave(payload);
    setSaving(false);
    onClose();
  };

  const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

  return (
    <FormModal title={isEdicao ? (moduloOrcamento ? `Editar Orçamento — ${pedido.numero}` : `Editar Pedido — ${pedido.numero}`) : (moduloOrcamento ? 'Novo Orçamento' : 'Novo Pedido de Venda')}
      onClose={onClose} onSave={handleSave} saving={saving} size="xl">
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="grid grid-cols-3 gap-3">
          {moduloOrcamento && (
            <div className="col-span-3">
              <label className={lbl}>Oportunidade CRM {req}</label>
              <select
                className={inp}
                value={form.oportunidade_id || ''}
                onChange={(e) => upd('oportunidade_id', e.target.value)}
              >
                <option value="">Selecione a oportunidade...</option>
                {opps.map((o) => (
                  <option key={o.id} value={o.id}>
                    {(o.titulo || '—') + (o.empresa ? ` — ${o.empresa}` : '')}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">Obrigatório para rastrear orçamento → pedido (exceto administradores).</p>
            </div>
          )}
          <div className="col-span-2">
            <label className={lbl}>Cliente {req}</label>
            <select className={inp} value={form.cliente_nome} onChange={e=>upd('cliente_nome',e.target.value)}>
              <option value="">Selecionar cliente...</option>
              {CLIENTES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select className={inp} value={form.status} onChange={e=>upd('status',e.target.value)}>
              {['Orçamento','Aprovado','Em Produção','Faturado','Entregue','Cancelado'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Vendedor</label>
            <select className={inp} value={form.vendedor} onChange={e=>upd('vendedor',e.target.value)}>
              <option value="">Selecionar...</option>
              {VENDEDORES.map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Data Emissão</label>
            <input type="date" className={inp} value={form.data_emissao} onChange={e=>upd('data_emissao',e.target.value)}/>
          </div>
          {moduloOrcamento ? (
            <div>
              <label className={lbl}>Validade proposta</label>
              <input type="date" className={inp} value={form.validade || ''} onChange={(e) => upd('validade', e.target.value)} />
            </div>
          ) : (
            <div>
              <label className={lbl}>Data Entrega</label>
              <input type="date" className={inp} value={form.data_entrega} onChange={e=>upd('data_entrega',e.target.value)}/>
            </div>
          )}
          <div>
            <label className={lbl}>Forma Pagamento</label>
            <select className={inp} value={form.forma_pagamento} onChange={e=>upd('forma_pagamento',e.target.value)}>
              {FORMAS_PAG.map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Itens */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Itens do Pedido</span>
            <button onClick={addItem} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12}/>Adicionar item</button>
          </div>
          <div className="border border-border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-36">Produto</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-16">Qtd</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-24">Preço Unit.</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-16">Desc.%</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-24">Total</th>
                <th className="w-8"/>
              </tr></thead>
              <tbody>
                {itens.map((it,idx)=>{
                  const tot = (it.quantidade||0)*(it.preco_unitario||0)*(1-(it.desconto||0)/100);
                  return (
                    <tr key={idx} className="border-t border-border">
                      <td className="px-2 py-1">
                        <select className={inp} value={it.produto_codigo} onChange={e=>selectProduto(idx,e.target.value)}>
                          <option value="">Selecionar...</option>
                          {PRODUTOS_LIST.map(p=><option key={p.codigo} value={p.codigo}>{p.codigo}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1"><input className={inp} value={it.produto_descricao} onChange={e=>updItem(idx,'produto_descricao',e.target.value)} placeholder="Descrição..."/></td>
                      <td className="px-2 py-1"><input type="number" min="1" className={inp} value={it.quantidade} onChange={e=>updItem(idx,'quantidade',Number(e.target.value))}/></td>
                      <td className="px-2 py-1"><input type="number" min="0" step="0.01" className={inp} value={it.preco_unitario} onChange={e=>updItem(idx,'preco_unitario',Number(e.target.value))}/></td>
                      <td className="px-2 py-1"><input type="number" min="0" max="100" className={inp} value={it.desconto} onChange={e=>updItem(idx,'desconto',Number(e.target.value))}/></td>
                      <td className="px-2 py-1 font-medium">{fmtR(tot)}</td>
                      <td className="px-2 py-1"><button onClick={()=>removeItem(idx)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12}/></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-2">
            <div className="text-sm font-bold text-foreground">Total: {fmtR(total)}</div>
          </div>
        </div>

        <div>
          <label className={lbl}>Observações</label>
          <textarea rows={2} className={inp} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)} placeholder="Obs do pedido..."/>
        </div>
      </div>
    </FormModal>
  );
}