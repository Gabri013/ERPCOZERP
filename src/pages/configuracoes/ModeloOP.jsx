import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Save, Plus, Eye, Trash2, GripVertical, Type, Hash, Image, Table, Minus, QrCode, BarChart } from 'lucide-react';

const CAMPOS_DINAMICOS = [
  '{{numero_op}}','{{numero_pedido}}','{{cliente}}','{{produto}}','{{descricao}}',
  '{{quantidade}}','{{data_emissao}}','{{prazo}}','{{observacao}}','{{informacao_complementar}}'
];

const ELEMENTOS_PALETTE = [
  { tipo:'texto_fixo', icone:Type, label:'Texto Fixo' },
  { tipo:'campo_dinamico', icone:Hash, label:'Campo Dinâmico' },
  { tipo:'logo', icone:Image, label:'Logo' },
  { tipo:'tabela_processos', icone:Table, label:'Tabela de Processos' },
  { tipo:'tabela_apontamentos', icone:Table, label:'Tabela de Apontamentos' },
  { tipo:'linha', icone:Minus, label:'Linha Separadora' },
  { tipo:'qrcode', icone:QrCode, label:'QR Code' },
  { tipo:'barcode', icone:BarChart, label:'Código de Barras' },
];

const MODELOS_MOCK = [
  { id:1, nome:'Modelo Padrão', padrao:true },
  { id:2, nome:'Modelo Simplificado', padrao:false },
];

function ElementoCard({ el, onRemove }) {
  const label = {
    texto_fixo: `Texto: "${el.conteudo||'...'}"`,
    campo_dinamico: `Campo: ${el.campo||'—'}`,
    logo: 'Logo da empresa',
    tabela_processos: 'Tabela: Processos',
    tabela_apontamentos: 'Tabela: Apontamentos',
    linha: '── Linha Separadora ──',
    qrcode: 'QR Code',
    barcode: 'Código de Barras',
  }[el.tipo] || el.tipo;

  return (
    <div className="flex items-center gap-2 bg-white border border-border rounded px-3 py-2 group">
      <GripVertical size={13} className="text-muted-foreground cursor-grab shrink-0"/>
      <span className="text-xs flex-1">{label}</span>
      <button onClick={() => onRemove(el.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
        <Trash2 size={12}/>
      </button>
    </div>
  );
}

export default function ModeloOP() {
  const [modelos, setModelos] = useState(MODELOS_MOCK);
  const [modeloAtivo, setModeloAtivo] = useState(1);
  const [elementos, setElementos] = useState([
    { id:1, tipo:'logo', conteudo:null },
    { id:2, tipo:'texto_fixo', conteudo:'ORDEM DE PRODUÇÃO' },
    { id:3, tipo:'campo_dinamico', campo:'{{numero_op}}' },
    { id:4, tipo:'campo_dinamico', campo:'{{cliente}}' },
    { id:5, tipo:'campo_dinamico', campo:'{{produto}}' },
    { id:6, tipo:'campo_dinamico', campo:'{{quantidade}}' },
    { id:7, tipo:'campo_dinamico', campo:'{{prazo}}' },
    { id:8, tipo:'linha' },
    { id:9, tipo:'tabela_processos' },
    { id:10, tipo:'linha' },
    { id:11, tipo:'campo_dinamico', campo:'{{observacao}}' },
    { id:12, tipo:'barcode' },
  ]);
  const [novoTipo, setNovoTipo] = useState('texto_fixo');
  const [novoConteudo, setNovoConteudo] = useState('');
  const [novoCampo, setNovoCampo] = useState(CAMPOS_DINAMICOS[0]);
  const [preview, setPreview] = useState(false);

  const addElemento = () => {
    const id = Date.now();
    let el = { id, tipo: novoTipo };
    if (novoTipo === 'texto_fixo') el.conteudo = novoConteudo || 'Novo texto';
    if (novoTipo === 'campo_dinamico') el.campo = novoCampo;
    setElementos(prev => [...prev, el]);
    setNovoConteudo('');
  };

  const removeElemento = (id) => setElementos(prev => prev.filter(e => e.id !== id));

  const inp = 'border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';

  return (
    <div>
      <PageHeader title="Modelo de Ordem de Produção" breadcrumbs={['Início','Configurações','Modelo de OP']}
        actions={
          <div className="flex gap-2">
            <button onClick={()=>setPreview(!preview)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"><Eye size={13}/>{preview?'Fechar Preview':'Preview'}</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90"><Save size={13}/> Salvar Modelo</button>
          </div>
        }
      />

      <div className="flex gap-4">
        {/* Esquerda — configuração */}
        <div className="flex flex-col gap-3 w-72 shrink-0">
          {/* Seleção de modelo */}
          <div className="bg-white border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold">Modelos</h3>
              <button className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={11}/> Novo</button>
            </div>
            <div className="space-y-1">
              {modelos.map(m => (
                <button key={m.id} onClick={()=>setModeloAtivo(m.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${modeloAtivo===m.id?'cozinha-blue-bg text-white':'hover:bg-muted'}`}>
                  <span>{m.nome}</span>
                  {m.padrao && <span className={`text-[10px] px-1.5 py-0.5 rounded ${modeloAtivo===m.id?'bg-white/20':'bg-green-100 text-green-700'}`}>Padrão</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Adicionar elemento */}
          <div className="bg-white border border-border rounded-lg p-3">
            <h3 className="text-xs font-semibold mb-2">Adicionar Elemento</h3>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-0.5">Tipo</label>
                <select className={`${inp} w-full`} value={novoTipo} onChange={e=>setNovoTipo(e.target.value)}>
                  {ELEMENTOS_PALETTE.map(el=><option key={el.tipo} value={el.tipo}>{el.label}</option>)}
                </select>
              </div>
              {novoTipo === 'texto_fixo' && (
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-0.5">Conteúdo</label>
                  <input className={`${inp} w-full`} value={novoConteudo} onChange={e=>setNovoConteudo(e.target.value)} placeholder="Texto fixo..."/>
                </div>
              )}
              {novoTipo === 'campo_dinamico' && (
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-0.5">Campo</label>
                  <select className={`${inp} w-full`} value={novoCampo} onChange={e=>setNovoCampo(e.target.value)}>
                    {CAMPOS_DINAMICOS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <button onClick={addElemento} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
                <Plus size={12}/> Adicionar
              </button>
            </div>
          </div>

          {/* Referência campos */}
          <div className="bg-white border border-border rounded-lg p-3">
            <h3 className="text-xs font-semibold mb-2">Campos Disponíveis</h3>
            <div className="space-y-1">
              {CAMPOS_DINAMICOS.map(c=>(
                <div key={c} className="text-[10px] font-mono bg-muted rounded px-2 py-1 text-muted-foreground">{c}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Centro — canvas */}
        <div className="flex-1">
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold">Estrutura do Modelo</h3>
              <span className="text-[11px] text-muted-foreground">{elementos.length} elementos</span>
            </div>
            <div className="space-y-2">
              {elementos.map(el=><ElementoCard key={el.id} el={el} onRemove={removeElemento}/>)}
              {elementos.length === 0 && (
                <div className="text-center py-10 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  Adicione elementos ao modelo usando o painel à esquerda
                </div>
              )}
            </div>
          </div>

          {/* Preview A4 */}
          {preview && (
            <div className="mt-4 bg-white border border-border rounded-lg p-4">
              <h3 className="text-xs font-semibold mb-3">Preview — Folha A4</h3>
              <div className="border border-gray-300 rounded" style={{ width:'595px', minHeight:'842px', padding:'40px', margin:'0 auto', fontFamily:'Arial, sans-serif', fontSize:'12px' }}>
                {elementos.map((el, i) => (
                  <div key={el.id} style={{ marginBottom:'8px' }}>
                    {el.tipo === 'logo' && <div style={{ width:'80px', height:'40px', background:'#e6f2ff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'4px', fontSize:'10px', color:'#0066cc' }}>LOGO</div>}
                    {el.tipo === 'texto_fixo' && <div style={{ fontWeight:'bold', fontSize:'16px', textAlign:'center' }}>{el.conteudo}</div>}
                    {el.tipo === 'campo_dinamico' && <div style={{ display:'flex', gap:'8px' }}><span style={{ color:'#666', minWidth:'120px' }}>{el.campo?.replace(/\{\{|\}\}/g,'').replace(/_/g,' ').toUpperCase()}:</span><strong style={{ color:'#003399' }}>{el.campo}</strong></div>}
                    {el.tipo === 'linha' && <hr style={{ border:'none', borderTop:'1px solid #ccc', margin:'8px 0' }}/>}
                    {el.tipo === 'tabela_processos' && <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'10px' }}><thead><tr style={{ background:'#e6f2ff' }}>{['Etapa','Responsável','Tempo Prev.','Status'].map(h=><th key={h} style={{ border:'1px solid #ccc', padding:'4px 8px', textAlign:'left' }}>{h}</th>)}</tr></thead><tbody>{['Corte a Laser','Dobra','Solda'].map(e=><tr key={e}><td style={{ border:'1px solid #ccc', padding:'4px 8px' }}>{e}</td><td style={{ border:'1px solid #ccc', padding:'4px 8px' }}>—</td><td style={{ border:'1px solid #ccc', padding:'4px 8px' }}>—</td><td style={{ border:'1px solid #ccc', padding:'4px 8px' }}>Pendente</td></tr>)}</tbody></table>}
                    {el.tipo === 'barcode' && <div style={{ background:'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)', height:'40px', width:'150px' }}/>}
                    {el.tipo === 'qrcode' && <div style={{ width:'50px', height:'50px', background:'#e0e0e0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px' }}>QR</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}