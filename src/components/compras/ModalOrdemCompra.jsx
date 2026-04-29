import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

const FORNECEDORES = ['Rolamentos Nacionais Ltda','AçoFlex Distribuidora','Fixadores do Brasil S/A','Motores Elite S/A','Correias e Polias Ltda'];
const PRODUTOS_LIST = [
  { codigo:'PRD-001', descricao:'Eixo Transmissão 25mm', preco:45.50 },
  { codigo:'PRD-002', descricao:'Rolamento 6205-ZZ', preco:8.20 },
  { codigo:'PRD-003', descricao:'Chapa Aço 3mm', preco:320.00 },
  { codigo:'PRD-004', descricao:'Parafuso M8x30', preco:12.50 },
];

export default function ModalOrdemCompra({ oc, onClose, onSave }) {
  const [form, setForm] = useState(oc || {
    fornecedor_nome:'', data_emissao:new Date().toISOString().slice(0,10),
    data_entrega_prevista:'', status:'Rascunho', observacoes:''
  });
  const [itens, setItens] = useState(oc?.itens || [{ produto_id:'', produto_descricao:'', quantidade:1, unidade:'UN', preco_unitario:0 }]);
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const addItem = () => setItens(i=>[...i,{produto_id:'',produto_descricao:'',quantidade:1,unidade:'UN',preco_unitario:0}]);
  const removeItem = idx => setItens(i=>i.filter((_,j)=>j!==idx));
  const updItem = (idx,k,v) => setItens(i=>i.map((it,j)=>j===idx?{...it,[k]:v}:it));
  const selectProduto = (idx, codigo) => {
    const p = PRODUTOS_LIST.find(x=>x.codigo===codigo);
    if(p) setItens(i=>i.map((it,j)=>j===idx?{...it,produto_id:codigo,produto_descricao:p.descricao,preco_unitario:p.preco}:it));
  };

  const total = itens.reduce((sum,it)=>sum+(it.quantidade||0)*(it.preco_unitario||0),0);
  const fmtR = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

  const handleSave = async () => {
    if(!form.fornecedor_nome) return alert('Selecione o fornecedor');
    setSaving(true);
    await onSave({...form,itens,valor_total:total});
    setSaving(false);
    onClose();
  };

  return (
    <FormModal title={oc?`Editar OC — ${oc.numero}`:'Nova Ordem de Compra'} onClose={onClose} onSave={handleSave} saving={saving} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={lbl}>Fornecedor {req}</label>
            <select className={inp} value={form.fornecedor_nome} onChange={e=>upd('fornecedor_nome',e.target.value)}>
              <option value="">Selecionar fornecedor...</option>
              {FORNECEDORES.map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select className={inp} value={form.status} onChange={e=>upd('status',e.target.value)}>
              {['Rascunho','Enviada','Parcialmente Recebida','Recebida','Cancelada'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Data Emissão</label>
            <input type="date" className={inp} value={form.data_emissao} onChange={e=>upd('data_emissao',e.target.value)}/>
          </div>
          <div>
            <label className={lbl}>Previsão Entrega</label>
            <input type="date" className={inp} value={form.data_entrega_prevista} onChange={e=>upd('data_entrega_prevista',e.target.value)}/>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Itens</span>
            <button onClick={addItem} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12}/>Adicionar</button>
          </div>
          <div className="border border-border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-32">Produto</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-16">Qtd</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-16">UN</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-24">Preço Unit.</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-24">Total</th>
                <th className="w-8"/>
              </tr></thead>
              <tbody>
                {itens.map((it,idx)=>(
                  <tr key={idx} className="border-t border-border">
                    <td className="px-2 py-1">
                      <select className={inp} value={it.produto_id} onChange={e=>selectProduto(idx,e.target.value)}>
                        <option value="">Sel...</option>
                        {PRODUTOS_LIST.map(p=><option key={p.codigo} value={p.codigo}>{p.codigo}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1"><input className={inp} value={it.produto_descricao} onChange={e=>updItem(idx,'produto_descricao',e.target.value)}/></td>
                    <td className="px-2 py-1"><input type="number" min="1" className={inp} value={it.quantidade} onChange={e=>updItem(idx,'quantidade',Number(e.target.value))}/></td>
                    <td className="px-2 py-1">
                      <select className={inp} value={it.unidade} onChange={e=>updItem(idx,'unidade',e.target.value)}>
                        {['UN','KG','MT','PC','CX'].map(u=><option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1"><input type="number" min="0" step="0.01" className={inp} value={it.preco_unitario} onChange={e=>updItem(idx,'preco_unitario',Number(e.target.value))}/></td>
                    <td className="px-2 py-1 font-medium">{fmtR((it.quantidade||0)*(it.preco_unitario||0))}</td>
                    <td className="px-2 py-1"><button onClick={()=>removeItem(idx)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-2">
            <span className="text-sm font-bold">Total: {fmtR(total)}</span>
          </div>
        </div>
        <div><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)}/></div>
      </div>
    </FormModal>
  );
}