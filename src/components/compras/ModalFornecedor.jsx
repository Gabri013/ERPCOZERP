import { useState } from 'react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const EMPTY = { codigo:'', razao_social:'', nome_fantasia:'', tipo:'PJ', cnpj_cpf:'', email:'', telefone:'', contato:'', cep:'', endereco:'', cidade:'', estado:'SP', prazo_entrega:7, status:'Ativo', observacoes:'' };

export default function ModalFornecedor({ fornecedor, onClose, onSave }) {
  const [form, setForm] = useState(fornecedor || EMPTY);
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if(!form.razao_social) return alert('Razão Social é obrigatória');
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <FormModal title={fornecedor?`Editar — ${fornecedor.razao_social}`:'Novo Fornecedor'} onClose={onClose} onSave={handleSave} saving={saving} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><label className={lbl}>Tipo</label>
            <select className={inp} value={form.tipo} onChange={e=>upd('tipo',e.target.value)}>
              <option value="PJ">PJ</option><option value="PF">PF</option>
            </select>
          </div>
          <div className="col-span-2"><label className={lbl}>Razão Social {req}</label><input className={inp} value={form.razao_social} onChange={e=>upd('razao_social',e.target.value)}/></div>
          <div><label className={lbl}>Nome Fantasia</label><input className={inp} value={form.nome_fantasia} onChange={e=>upd('nome_fantasia',e.target.value)}/></div>
          <div><label className={lbl}>CNPJ/CPF</label><input className={inp} value={form.cnpj_cpf} onChange={e=>upd('cnpj_cpf',e.target.value)}/></div>
          <div><label className={lbl}>Status</label>
            <select className={inp} value={form.status} onChange={e=>upd('status',e.target.value)}>
              <option>Ativo</option><option>Inativo</option>
            </select>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Contato</div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>E-mail</label><input type="email" className={inp} value={form.email} onChange={e=>upd('email',e.target.value)}/></div>
            <div><label className={lbl}>Telefone</label><input className={inp} value={form.telefone} onChange={e=>upd('telefone',e.target.value)}/></div>
            <div><label className={lbl}>Contato</label><input className={inp} value={form.contato} onChange={e=>upd('contato',e.target.value)}/></div>
            <div><label className={lbl}>Prazo Entrega (dias)</label><input type="number" className={inp} value={form.prazo_entrega} onChange={e=>upd('prazo_entrega',Number(e.target.value))}/></div>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Endereço</div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className={lbl}>CEP</label><input className={inp} value={form.cep} onChange={e=>upd('cep',e.target.value)}/></div>
            <div className="col-span-2"><label className={lbl}>Endereço</label><input className={inp} value={form.endereco} onChange={e=>upd('endereco',e.target.value)}/></div>
            <div><label className={lbl}>Cidade</label><input className={inp} value={form.cidade} onChange={e=>upd('cidade',e.target.value)}/></div>
            <div><label className={lbl}>Estado</label><select className={inp} value={form.estado} onChange={e=>upd('estado',e.target.value)}>{ESTADOS.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)}/></div>
      </div>
    </FormModal>
  );
}