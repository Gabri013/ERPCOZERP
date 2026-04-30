import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const ETAPAS_DEFAULT = ['Programação','Engenharia','Corte a Laser','Retirada','Rebarbação','Dobra','Solda','Montagem','Acabamento','Qualidade','Embalagem','Expedição'];

const CLIENTES = ['Metalúrgica ABC Ltda','SiderTech S/A','TechParts Ltda','Grupo Delta','Ind. XYZ S/A'];
const PRODUTOS = [
  { codigo:'EIX-025', descricao:'Eixo Transmissão 25mm' },
  { codigo:'ROL-ESP-01', descricao:'Conjunto Rolamento Especial' },
  { codigo:'FLA-INOX-3', descricao:'Flange Aço Inox 3"' },
  { codigo:'RED-MOD5', descricao:'Caixa Redutora Mod.5' },
  { codigo:'BUC-BRZ-3040', descricao:'Bucha Bronze 30x40' },
];

const EMPTY = {
  pedidoId: '', clienteNome: '', codigoProduto: '', produtoDescricao: '',
  quantidade: '', unidade: 'UN', dataEmissao: new Date().toISOString().slice(0,10),
  prazo: '', prioridade: 'Normal', responsavel: '', observacao: '', informacaoComplementar: '',
};

const inp = 'w-full border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';
const lbl = 'block text-[11px] text-muted-foreground mb-0.5';
const req = <span className="text-red-500">*</span>;

export default function ModalNovaOP({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const upd = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.clienteNome) errs.clienteNome = 'Obrigatório';
    if (!form.codigoProduto) errs.codigoProduto = 'Obrigatório';
    if (!form.produtoDescricao) errs.produtoDescricao = 'Obrigatório';
    if (!form.quantidade || Number(form.quantidade) <= 0) errs.quantidade = 'Deve ser > 0';
    if (!form.dataEmissao) errs.dataEmissao = 'Obrigatório';
    if (!form.prazo) errs.prazo = 'Obrigatório';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await onSave({ ...form, quantidade: Number(form.quantidade), status: 'aberta' });
    setSaving(false);
    onClose();
  };

  const selectProduto = (codigo) => {
    const p = PRODUTOS.find(x => x.codigo === codigo);
    upd('codigoProduto', codigo);
    if (p) upd('produtoDescricao', p.descricao);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Nova Ordem de Produção</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Linha 1 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Nº Pedido de Venda</label>
              <input className={inp} placeholder="PV-00542" value={form.pedidoId} onChange={e=>upd('pedidoId',e.target.value)}/>
            </div>
            <div className="col-span-2">
              <label className={lbl}>Cliente {req}</label>
              <select className={`${inp} ${errors.clienteNome?'border-red-400':''}`} value={form.clienteNome} onChange={e=>upd('clienteNome',e.target.value)}>
                <option value="">Selecionar...</option>
                {CLIENTES.map(c=><option key={c}>{c}</option>)}
              </select>
              {errors.clienteNome && <p className="text-[10px] text-red-500 mt-0.5">{errors.clienteNome}</p>}
            </div>
          </div>

          {/* Linha 2 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Código do Produto {req}</label>
              <select className={`${inp} ${errors.codigoProduto?'border-red-400':''}`} value={form.codigoProduto} onChange={e=>selectProduto(e.target.value)}>
                <option value="">Selecionar...</option>
                {PRODUTOS.map(p=><option key={p.codigo} value={p.codigo}>{p.codigo}</option>)}
              </select>
              {errors.codigoProduto && <p className="text-[10px] text-red-500 mt-0.5">{errors.codigoProduto}</p>}
            </div>
            <div className="col-span-2">
              <label className={lbl}>Descrição do Produto {req}</label>
              <input className={`${inp} ${errors.produtoDescricao?'border-red-400':''}`} value={form.produtoDescricao} onChange={e=>upd('produtoDescricao',e.target.value)}/>
              {errors.produtoDescricao && <p className="text-[10px] text-red-500 mt-0.5">{errors.produtoDescricao}</p>}
            </div>
          </div>

          {/* Linha 3 */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={lbl}>Quantidade {req}</label>
              <input type="number" min="1" className={`${inp} ${errors.quantidade?'border-red-400':''}`} value={form.quantidade} onChange={e=>upd('quantidade',e.target.value)}/>
              {errors.quantidade && <p className="text-[10px] text-red-500 mt-0.5">{errors.quantidade}</p>}
            </div>
            <div>
              <label className={lbl}>Unidade</label>
              <select className={inp} value={form.unidade} onChange={e=>upd('unidade',e.target.value)}>
                {['UN','KG','MT','PC','CX','L'].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Data Emissão {req}</label>
              <input type="date" className={`${inp} ${errors.dataEmissao?'border-red-400':''}`} value={form.dataEmissao} onChange={e=>upd('dataEmissao',e.target.value)}/>
              {errors.dataEmissao && <p className="text-[10px] text-red-500 mt-0.5">{errors.dataEmissao}</p>}
            </div>
            <div>
              <label className={lbl}>Prazo / Entrega {req}</label>
              <input type="date" className={`${inp} ${errors.prazo?'border-red-400':''}`} value={form.prazo} onChange={e=>upd('prazo',e.target.value)}/>
              {errors.prazo && <p className="text-[10px] text-red-500 mt-0.5">{errors.prazo}</p>}
            </div>
          </div>

          {/* Linha 4 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Prioridade</label>
              <select className={inp} value={form.prioridade} onChange={e=>upd('prioridade',e.target.value)}>
                {['Baixa','Normal','Alta','Urgente'].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Responsável</label>
              <input className={inp} placeholder="Nome do responsável" value={form.responsavel} onChange={e=>upd('responsavel',e.target.value)}/>
            </div>
          </div>

          {/* Linha 5 */}
          <div>
            <label className={lbl}>Observação</label>
            <textarea rows={2} className={inp} value={form.observacao} onChange={e=>upd('observacao',e.target.value)} placeholder="Observações gerais sobre a OP..."/>
          </div>

          <div>
            <label className={lbl}>Informação Complementar</label>
            <textarea rows={2} className={inp} value={form.informacaoComplementar} onChange={e=>upd('informacaoComplementar',e.target.value)} placeholder="Ex: ITEM 01 do pedido, referência especial..."/>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2">
              <AlertCircle size={13} className="text-red-500 shrink-0"/>
              <span className="text-[11px] text-red-600">Preencha todos os campos obrigatórios antes de salvar.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30">
          <button onClick={onClose} className="px-4 py-1.5 text-xs border border-border rounded hover:bg-muted">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5">
            {saving ? 'Salvando...' : 'Criar Ordem de Produção'}
          </button>
        </div>
      </div>
    </div>
  );
}