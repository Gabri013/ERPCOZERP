import { useState } from 'react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

const EMPTY = { codigo:'', descricao:'', referencia:'', grupo:'', unidade:'UN', preco_custo:0, preco_venda:0, estoque_atual:0, estoque_minimo:0, estoque_maximo:'', localizacao:'', tipo:'Produto', ncm:'', ean:'', peso_bruto:'', peso_liquido:'', status:'Ativo', observacoes:'' };
const TIPOS = ['Produto','Serviço','Matéria-Prima','Semi-Acabado'];
const UNIDADES = ['UN','KG','MT','PC','CX','L','M²','M³','H'];
const GRUPOS = ['Eixos','Rolamentos','Chapas','Fixadores','Motores','Correias','Serviços','Flanges','Buchas'];

export default function ModalProduto({ produto, onClose, onSave }) {
  const [form, setForm] = useState(produto || EMPTY);
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if(!form.descricao) return alert('Descrição é obrigatória');
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <FormModal title={produto?`Editar — ${produto.descricao}`:'Novo Produto/Serviço'} onClose={onClose} onSave={handleSave} saving={saving} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><label className={lbl}>Tipo</label>
            <select className={inp} value={form.tipo} onChange={e=>upd('tipo',e.target.value)}>
              {TIPOS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Código</label><input className={inp} value={form.codigo} onChange={e=>upd('codigo',e.target.value)} placeholder="PRD-001"/></div>
          <div><label className={lbl}>Status</label>
            <select className={inp} value={form.status} onChange={e=>upd('status',e.target.value)}>
              <option>Ativo</option><option>Inativo</option>
            </select>
          </div>
          <div className="col-span-3"><label className={lbl}>Descrição {req}</label><input className={inp} value={form.descricao} onChange={e=>upd('descricao',e.target.value)}/></div>
          <div><label className={lbl}>Grupo</label>
            <select className={inp} value={form.grupo} onChange={e=>upd('grupo',e.target.value)}>
              <option value="">Selecionar...</option>
              {GRUPOS.map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Unidade</label>
            <select className={inp} value={form.unidade} onChange={e=>upd('unidade',e.target.value)}>
              {UNIDADES.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Localização</label><input className={inp} value={form.localizacao} onChange={e=>upd('localizacao',e.target.value)} placeholder="A1-B2"/></div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Preços</div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Custo (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.preco_custo} onChange={e=>upd('preco_custo',Number(e.target.value))}/></div>
            <div><label className={lbl}>Venda (R$)</label><input type="number" min="0" step="0.01" className={inp} value={form.preco_venda} onChange={e=>upd('preco_venda',Number(e.target.value))}/></div>
            <div><label className={lbl}>Margem</label><input className={`${inp} bg-muted`} readOnly value={form.preco_custo>0?`${(((form.preco_venda-form.preco_custo)/form.preco_custo)*100).toFixed(1)}%`:'—'}/></div>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Estoque</div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Estoque Atual</label><input type="number" min="0" className={inp} value={form.estoque_atual} onChange={e=>upd('estoque_atual',Number(e.target.value))}/></div>
            <div><label className={lbl}>Estoque Mínimo</label><input type="number" min="0" className={inp} value={form.estoque_minimo} onChange={e=>upd('estoque_minimo',Number(e.target.value))}/></div>
            <div><label className={lbl}>Estoque Máximo</label><input type="number" min="0" className={inp} value={form.estoque_maximo} onChange={e=>upd('estoque_maximo',e.target.value)}/></div>
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Dados Fiscais</div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>NCM</label><input className={inp} value={form.ncm} onChange={e=>upd('ncm',e.target.value)} placeholder="0000.00.00"/></div>
            <div><label className={lbl}>EAN/GTIN</label><input className={inp} value={form.ean} onChange={e=>upd('ean',e.target.value)}/></div>
          </div>
        </div>
        <div><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)}/></div>
      </div>
    </FormModal>
  );
}