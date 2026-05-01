import { useState } from 'react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

const DEPTOS = ['Produção','Qualidade','Vendas','Financeiro','RH','Compras','TI','Diretoria'];
const CARGOS = ['Operador CNC','Torneiro Mecânico','Analista de Qualidade','Gerente de Vendas','Analista Financeiro','Vendedor Externo','Analista de RH','Supervisor de Produção'];
const TIPOS = ['CLT','PJ','Temporário','Estagiário'];
const ESTADOS = ['SP','RJ','MG','RS','PR','SC','BA','GO','DF','ES'];

const EMPTY = {
  matricula:'', nome:'', cpf:'', rg:'', cargo:'', departamento:'', email:'', telefone:'',
  data_admissao:'', salario:'', tipo_contrato:'CLT', status:'Ativo', endereco:'', cidade:'', estado:'SP'
};

export default function ModalFuncionario({ funcionario, onClose, onSave }) {
  const [form, setForm] = useState(funcionario || EMPTY);
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if(!form.nome) return alert('Nome é obrigatório');
    setSaving(true);
    await onSave({...form, salario:Number(form.salario)});
    setSaving(false);
    onClose();
  };

  return (
    <FormModal title={funcionario?`Editar — ${funcionario.nome}`:'Novo Funcionário'} onClose={onClose} onSave={handleSave} saving={saving} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><label className={lbl}>Matrícula</label><input className={inp} value={form.matricula} onChange={e=>upd('matricula',e.target.value)} placeholder="MAT-008"/></div>
          <div className="col-span-2"><label className={lbl}>Nome Completo {req}</label><input className={inp} value={form.nome} onChange={e=>upd('nome',e.target.value)}/></div>
          <div><label className={lbl}>CPF</label><input className={inp} value={form.cpf} onChange={e=>upd('cpf',e.target.value)} placeholder="000.000.000-00"/></div>
          <div><label className={lbl}>RG</label><input className={inp} value={form.rg} onChange={e=>upd('rg',e.target.value)}/></div>
          <div><label className={lbl}>Status</label>
            <select className={inp} value={form.status} onChange={e=>upd('status',e.target.value)}>
              {['Ativo','Inativo','Férias','Afastado'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Dados Profissionais</div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Cargo</label>
              <select className={inp} value={form.cargo} onChange={e=>upd('cargo',e.target.value)}>
                <option value="">Selecionar...</option>
                {CARGOS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Departamento</label>
              <select className={inp} value={form.departamento} onChange={e=>upd('departamento',e.target.value)}>
                <option value="">Selecionar...</option>
                {DEPTOS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Tipo Contrato</label>
              <select className={inp} value={form.tipo_contrato} onChange={e=>upd('tipo_contrato',e.target.value)}>
                {TIPOS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Admissão</label><input type="date" className={inp} value={form.data_admissao} onChange={e=>upd('data_admissao',e.target.value)}/></div>
            <div><label className={lbl}>Salário (R$)</label><input type="number" min="0" step="100" className={inp} value={form.salario} onChange={e=>upd('salario',e.target.value)}/></div>
            <div><label className={lbl}>E-mail</label><input type="email" className={inp} value={form.email} onChange={e=>upd('email',e.target.value)}/></div>
            <div><label className={lbl}>Telefone</label><input className={inp} value={form.telefone} onChange={e=>upd('telefone',e.target.value)}/></div>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Endereço</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={lbl}>Endereço</label><input className={inp} value={form.endereco} onChange={e=>upd('endereco',e.target.value)}/></div>
            <div><label className={lbl}>Cidade</label><input className={inp} value={form.cidade} onChange={e=>upd('cidade',e.target.value)}/></div>
            <div><label className={lbl}>Estado</label><select className={inp} value={form.estado} onChange={e=>upd('estado',e.target.value)}>{ESTADOS.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
      </div>
    </FormModal>
  );
}