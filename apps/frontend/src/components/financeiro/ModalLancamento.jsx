import { useState } from 'react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

const CATEGORIAS_RECEBER = ['Venda','Serviço','Adiantamento','Outros'];
const CATEGORIAS_PAGAR = ['Fornecedor','Aluguel','Utilidades','RH','Imposto','Outros'];
const ENTIDADES = ['Metalúrgica ABC Ltda','Ind. XYZ S/A','Grupo Delta','TechParts Ltda','Comércio Beta','Imóveis Galpão','CPFL','Vivo Empresas','Rolamentos Nacionais Ltda'];

export default function ModalLancamento({ tipo, lancamento, onClose, onSave }) {
  const categorias = tipo === 'Receber' ? CATEGORIAS_RECEBER : CATEGORIAS_PAGAR;
  const [form, setForm] = useState(lancamento || {
    tipo, descricao:'', cliente_fornecedor:'', valor:'',
    data_emissao:new Date().toISOString().slice(0,10),
    data_vencimento:'', status:'Aberto', categoria:categorias[0],
    documento:'', observacoes:''
  });
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if(!form.descricao) return alert('Informe a descrição');
    if(!form.valor || Number(form.valor)<=0) return alert('Informe o valor');
    if(!form.data_vencimento) return alert('Informe o vencimento');
    setSaving(true);
    await onSave({...form, valor:Number(form.valor)});
    setSaving(false);
    onClose();
  };

  return (
    <FormModal title={lancamento?`Editar Lançamento`:`Novo Lançamento — Contas a ${tipo}`}
      subtitle={`Tipo: ${tipo}`} onClose={onClose} onSave={handleSave} saving={saving} size="md">
      <div className="space-y-3">
        <div><label className={lbl}>Descrição {req}</label><input className={inp} value={form.descricao} onChange={e=>upd('descricao',e.target.value)} placeholder="Descrição do lançamento"/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>{tipo==='Receber'?'Cliente':'Fornecedor/Credor'}</label>
            <select className={inp} value={form.cliente_fornecedor} onChange={e=>upd('cliente_fornecedor',e.target.value)}>
              <option value="">Selecionar...</option>
              {ENTIDADES.map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Categoria</label>
            <select className={inp} value={form.categoria} onChange={e=>upd('categoria',e.target.value)}>
              {categorias.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Valor (R$) {req}</label><input type="number" min="0" step="0.01" className={inp} value={form.valor} onChange={e=>upd('valor',e.target.value)}/></div>
          <div><label className={lbl}>Status</label>
            <select className={inp} value={form.status} onChange={e=>upd('status',e.target.value)}>
              {['Aberto','Pago','Vencido','Cancelado'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Emissão</label><input type="date" className={inp} value={form.data_emissao} onChange={e=>upd('data_emissao',e.target.value)}/></div>
          <div><label className={lbl}>Vencimento {req}</label><input type="date" className={inp} value={form.data_vencimento} onChange={e=>upd('data_vencimento',e.target.value)}/></div>
          <div><label className={lbl}>Documento Ref.</label><input className={inp} value={form.documento} onChange={e=>upd('documento',e.target.value)} placeholder="NF-e, PV, OC..."/></div>
        </div>
        <div><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)}/></div>
      </div>
    </FormModal>
  );
}