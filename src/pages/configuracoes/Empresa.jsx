import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Save, Building2 } from 'lucide-react';

export default function Empresa() {
  const [form, setForm] = useState({
    razao_social:'Nomus Indústria e Comércio Ltda',
    nome_fantasia:'Cozinha ERP',
    cnpj:'12.345.678/0001-90',
    ie:'123.456.789.000',
    im:'12345678',
    regime:'Lucro Real',
    cep:'01310-100',
    endereco:'Av. Paulista, 1234',
    complemento:'Andar 10',
    bairro:'Bela Vista',
    cidade:'São Paulo',
    estado:'SP',
    telefone:'(11) 3333-4444',
    email:'contato@nomus.com.br',
    site:'www.nomus.com.br',
  });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = 'w-full border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';
  const lbl = 'block text-[11px] text-muted-foreground mb-0.5';
  return (
    <div>
      <PageHeader title="Dados da Empresa" breadcrumbs={['Início','Configurações','Empresa']}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Save size={13}/> Salvar</button>}
      />
      <div className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
          <div className="w-14 h-14 cozinha-blue-bg rounded-lg flex items-center justify-center"><Building2 size={28} className="text-white"/></div>
          <div>
            <div className="font-semibold text-sm">{form.razao_social}</div>
            <div className="text-xs text-muted-foreground">CNPJ: {form.cnpj}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2"><label className={lbl}>Razão Social</label><input className={inp} value={form.razao_social} onChange={e=>upd('razao_social',e.target.value)}/></div>
          <div><label className={lbl}>Nome Fantasia</label><input className={inp} value={form.nome_fantasia} onChange={e=>upd('nome_fantasia',e.target.value)}/></div>
          <div><label className={lbl}>CNPJ</label><input className={inp} value={form.cnpj} onChange={e=>upd('cnpj',e.target.value)}/></div>
          <div><label className={lbl}>Inscrição Estadual</label><input className={inp} value={form.ie} onChange={e=>upd('ie',e.target.value)}/></div>
          <div><label className={lbl}>Regime Tributário</label>
            <select className={inp} value={form.regime} onChange={e=>upd('regime',e.target.value)}>
              {['Simples Nacional','Lucro Presumido','Lucro Real'].map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 pt-2 border-t border-border">Endereço</div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div><label className={lbl}>CEP</label><input className={inp} value={form.cep} onChange={e=>upd('cep',e.target.value)}/></div>
          <div className="col-span-2"><label className={lbl}>Endereço</label><input className={inp} value={form.endereco} onChange={e=>upd('endereco',e.target.value)}/></div>
          <div><label className={lbl}>Complemento</label><input className={inp} value={form.complemento} onChange={e=>upd('complemento',e.target.value)}/></div>
          <div><label className={lbl}>Bairro</label><input className={inp} value={form.bairro} onChange={e=>upd('bairro',e.target.value)}/></div>
          <div className="col-span-2"><label className={lbl}>Cidade</label><input className={inp} value={form.cidade} onChange={e=>upd('cidade',e.target.value)}/></div>
          <div><label className={lbl}>Estado</label><input className={inp} value={form.estado} onChange={e=>upd('estado',e.target.value)}/></div>
        </div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 pt-2 border-t border-border">Contato</div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className={lbl}>Telefone</label><input className={inp} value={form.telefone} onChange={e=>upd('telefone',e.target.value)}/></div>
          <div><label className={lbl}>E-mail</label><input className={inp} value={form.email} onChange={e=>upd('email',e.target.value)}/></div>
          <div><label className={lbl}>Site</label><input className={inp} value={form.site} onChange={e=>upd('site',e.target.value)}/></div>
        </div>
      </div>
    </div>
  );
}