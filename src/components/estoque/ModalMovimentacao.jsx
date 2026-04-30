import { useState } from 'react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

const PRODUTOS = [
  'Eixo Transmissão 25mm','Rolamento 6205-ZZ','Chapa Aço 3mm','Parafuso M8x30','Motor Elétrico 1CV','Correia V-B52'
];
const RESPONSAVEIS = ['João M.','Pedro A.','Maria L.','Carlos S.'];
const TIPOS = ['Entrada','Saída','Transferência','Ajuste'];

export default function ModalMovimentacao({ onClose, onSave }) {
  const [form, setForm] = useState({
    tipo:'Entrada', produto_descricao:'', quantidade:1, unidade:'UN',
    custo_unitario:0, data:new Date().toISOString().slice(0,10),
    origem:'', responsavel:'', observacoes:''
  });
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if(!form.produto_descricao) return alert('Selecione o produto');
    if(!form.quantidade || form.quantidade <= 0) return alert('Quantidade deve ser > 0');
    setSaving(true);
    await onSave({...form, custo_total: (form.quantidade||0)*(form.custo_unitario||0)});
    setSaving(false);
    onClose();
  };

  return (
    <FormModal title="Nova Movimentação de Estoque" onClose={onClose} onSave={handleSave} saving={saving} size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>Tipo {req}</label>
            <select className={inp} value={form.tipo} onChange={e=>upd('tipo',e.target.value)}>
              {TIPOS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Data</label><input type="date" className={inp} value={form.data} onChange={e=>upd('data',e.target.value)}/></div>
          <div className="col-span-2"><label className={lbl}>Produto {req}</label>
            <select className={inp} value={form.produto_descricao} onChange={e=>upd('produto_descricao',e.target.value)}>
              <option value="">Selecionar produto...</option>
              {PRODUTOS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Quantidade</label><input type="number" min="1" className={inp} value={form.quantidade} onChange={e=>upd('quantidade',Number(e.target.value))}/></div>
          <div><label className={lbl}>Unidade</label>
            <select className={inp} value={form.unidade} onChange={e=>upd('unidade',e.target.value)}>
              {['UN','KG','MT','PC','CX','L'].map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Custo Unit. (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.custo_unitario} onChange={e=>upd('custo_unitario',Number(e.target.value))}/></div>
          <div><label className={lbl}>Total (R$)</label><input className={`${inp} bg-muted`} readOnly value={((form.quantidade||0)*(form.custo_unitario||0)).toFixed(2)}/></div>
          <div><label className={lbl}>Origem / Documento</label><input className={inp} value={form.origem} onChange={e=>upd('origem',e.target.value)} placeholder="Ex: OC-00231"/></div>
          <div><label className={lbl}>Responsável</label>
            <select className={inp} value={form.responsavel} onChange={e=>upd('responsavel',e.target.value)}>
              <option value="">Selecionar...</option>
              {RESPONSAVEIS.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)}/></div>
      </div>
    </FormModal>
  );
}