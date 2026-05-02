import { useEffect, useState } from 'react';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

const EMPTY = {
  codigo: '',
  nome: '',
  descricao: '',
  referencia: '',
  grupo: '',
  unidade: 'UN',
  foto_url: '',
  preco_custo: 0,
  preco_venda: 0,
  estoque_atual: 0,
  estoque_minimo: 0,
  ponto_pedido: '',
  estoque_maximo: '',
  localizacao: '',
  tipo: 'Produto',
  ncm: '',
  ean: '',
  peso_bruto: '',
  peso_liquido: '',
  status: 'Ativo',
  observacoes: '',
  bom_json: '',
  roteiro_json: '',
  ficha_tecnica: '',
};
const TIPOS = ['Produto','Serviço','Matéria-Prima','Semi-Acabado'];
const UNIDADES = ['UN','KG','MT','PC','CX','L','M²','M³','H'];
const GRUPOS = ['Eixos','Rolamentos','Chapas','Fixadores','Motores','Correias','Serviços','Flanges','Buchas'];

export default function ModalProduto({ produto, onClose, onSave }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...produto }));
  const [saving, setSaving] = useState(false);
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    setForm({ ...EMPTY, ...(produto || {}) });
  }, [produto?.id]);

  const handleSave = async () => {
    const nomeOuDesc = (form.nome || form.descricao || '').trim();
    if (!nomeOuDesc) return alert('Nome ou descrição é obrigatório');
    setSaving(true);
    const payload = {
      ...form,
      descricao: form.descricao?.trim() || form.nome?.trim() || '',
      nome: form.nome?.trim() || form.descricao?.trim() || '',
    };
    await onSave(payload);
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
          <div><label className={lbl}>Nome comercial</label><input className={inp} value={form.nome} onChange={e=>upd('nome',e.target.value)} placeholder="Igual à descrição se vazio"/></div>
          <div className="col-span-2"><label className={lbl}>Descrição {req}</label><input className={inp} value={form.descricao} onChange={e=>upd('descricao',e.target.value)}/></div>
          <div className="col-span-3"><label className={lbl}>URL da foto</label><input className={inp} type="url" value={form.foto_url} onChange={e=>upd('foto_url',e.target.value)} placeholder="https://..."/></div>
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
            <div>
              <label className={lbl}>Estoque atual</label>
              <input
                type="number"
                min="0"
                className={`${inp} bg-muted`}
                readOnly
                title="Atualizado por movimentações e inventário"
                value={form.estoque_atual ?? 0}
              />
            </div>
            <div><label className={lbl}>Estoque Mínimo</label><input type="number" min="0" className={inp} value={form.estoque_minimo} onChange={e=>upd('estoque_minimo',Number(e.target.value))}/></div>
            <div><label className={lbl}>Ponto de pedido</label><input type="number" min="0" className={inp} value={form.ponto_pedido} onChange={e=>upd('ponto_pedido',e.target.value)} placeholder="Reposição"/></div>
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
        <div className="border-t border-border pt-3 space-y-2">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase">Industrial / engenharia (JSON ou texto)</div>
          <div><label className={lbl}>BOM (JSON opcional)</label><textarea rows={3} className={`${inp} font-mono text-[11px]`} value={form.bom_json} onChange={e=>upd('bom_json',e.target.value)} placeholder="{ }"/></div>
          <div><label className={lbl}>Roteiro (JSON opcional)</label><textarea rows={3} className={`${inp} font-mono text-[11px]`} value={form.roteiro_json} onChange={e=>upd('roteiro_json',e.target.value)} /></div>
          <div><label className={lbl}>Ficha técnica</label><textarea rows={3} className={inp} value={form.ficha_tecnica} onChange={e=>upd('ficha_tecnica',e.target.value)} /></div>
        </div>
        <div><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)}/></div>
      </div>
    </FormModal>
  );
}