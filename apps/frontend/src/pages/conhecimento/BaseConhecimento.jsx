import { useState, useMemo, useEffect, useCallback } from 'react';
import { listCategories, listArticles } from '@/services/knowledgeApi.js';
import {
  BookOpen, Plus, Search, Folder, FileText,
  ChevronRight, ChevronDown, Eye, Pencil, History, Paperclip, Star, Download, Printer,
  ThumbsUp, ThumbsDown, X, ArrowLeft, Globe, Lock,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Categorias ───────────────────────────────────────────────────────────────
const CATEGORIAS = [
  {
    id: 1, nome: 'Qualidade', icone: '🏆', cor: 'bg-green-100 text-green-700 border-green-200',
    descricao: 'Procedimentos de inspeção, controle e certificação',
    subcategorias: ['Inspeção de Materiais', 'Ensaios', 'Certificados', 'Não Conformidades'],
  },
  {
    id: 2, nome: 'Produção', icone: '⚙️', cor: 'bg-blue-100 text-blue-700 border-blue-200',
    descricao: 'Roteiros, setup de máquinas e operações de fabricação',
    subcategorias: ['Soldagem', 'Usinagem', 'Montagem', 'Acabamento'],
  },
  {
    id: 3, nome: 'Segurança', icone: '🦺', cor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    descricao: 'NRs, EPIs, procedimentos de emergência e CIPA',
    subcategorias: ['EPIs', 'NR-12', 'NR-10', 'Emergências'],
  },
  {
    id: 4, nome: 'Comercial', icone: '📊', cor: 'bg-purple-100 text-purple-700 border-purple-200',
    descricao: 'Processos de vendas, propostas e atendimento ao cliente',
    subcategorias: ['Propostas', 'Negociação', 'Pós-venda'],
  },
  {
    id: 5, nome: 'TI / Sistemas', icone: '💻', cor: 'bg-gray-100 text-gray-700 border-gray-200',
    descricao: 'Manuais de uso dos sistemas ERP, configurações e suporte',
    subcategorias: ['ERP', 'Infraestrutura', 'Suporte'],
  },
  {
    id: 6, nome: 'RH', icone: '👥', cor: 'bg-pink-100 text-pink-700 border-pink-200',
    descricao: 'Onboarding, políticas internas e benefícios',
    subcategorias: ['Onboarding', 'Políticas', 'Benefícios'],
  },
];

// ─── Artigos ──────────────────────────────────────────────────────────────────
const ARTIGOS = [
  {
    id: 'ART-001', titulo: 'Procedimento de Inspeção Visual de Soldas',
    categoria: 1, subcategoria: 'Inspeção de Materiais', autor: 'Ana Qualidade',
    status: 'publicado', visibilidade: 'interno',
    criado: '2026-01-15', atualizado: '2026-04-20', versao: '3.1',
    visualizacoes: 142, curtidas: 18, tags: ['solda', 'inspeção', 'visual', 'ASME'],
    resumo: 'Define os critérios e metodologia para inspeção visual de juntas soldadas conforme normas ASME IX e AWS D1.1.',
    conteudo: `## Objetivo
Estabelecer os critérios e metodologia para a inspeção visual de juntas soldadas em equipamentos fabricados em aço inoxidável, conforme as normas **ASME IX** e **AWS D1.1**.

## Aplicação
Este procedimento aplica-se a todas as juntas soldadas em:
- Tanques de armazenamento
- Vasos de pressão
- Tubulações industriais
- Estruturas metálicas

## Equipamentos Necessários
- Gabarito de solda (tipo HI-LO ou similar)
- Lanterna de LED de alta intensidade
- Lupa 10×
- Régua metálica calibrada

## Critérios de Aceitação
| Descontinuidade | Limite Aceitável |
|---|---|
| Porosidade superficial | Ø máx. 1,5mm, distância ≥ 4× diâmetro |
| Trinca | **Não aceita** |
| Mordedura | Profundidade ≤ 0,8mm |
| Reforço excessivo | ≤ 3mm |

## Procedimento
1. Limpar a região da solda com escova de aço inoxidável
2. Iluminar com ângulo de 45° para melhor contraste
3. Registrar descontinuidades encontradas no Formulário QLD-F01
4. Emitir laudo de inspeção assinado pelo inspetor habilitado`,
    anexos: [
      { nome: 'QLD-F01_Formulario_Inspecao.pdf', tamanho: '48 KB' },
      { nome: 'Criterios_ASME_IX.pdf', tamanho: '1,2 MB' },
    ],
    historico: [
      { versao: '3.1', data: '2026-04-20', autor: 'Ana Qualidade', descricao: 'Atualização dos critérios de mordedura conforme nova revisão da AWS D1.1' },
      { versao: '3.0', data: '2026-02-10', autor: 'Carlos Eng.',   descricao: 'Inclusão de tabela de critérios de aceitação e referências normativas' },
      { versao: '2.1', data: '2025-11-05', autor: 'Ana Qualidade', descricao: 'Correção nos procedimentos de limpeza pré-inspeção' },
      { versao: '2.0', data: '2025-08-20', autor: 'Ana Qualidade', descricao: 'Revisão geral do procedimento' },
    ],
  },
  {
    id: 'ART-002', titulo: 'Setup e Operação da Calandra CNC',
    categoria: 2, subcategoria: 'Usinagem', autor: 'Pedro Prod.',
    status: 'publicado', visibilidade: 'interno',
    criado: '2026-02-01', atualizado: '2026-03-15', versao: '2.0',
    visualizacoes: 98, curtidas: 11, tags: ['calandra', 'cnc', 'setup', 'chapa'],
    resumo: 'Instrução de trabalho para setup, operação segura e manutenção preventiva da Calandra CNC Haeusler VRM-250.',
    conteudo: `## Objetivo
Descrever o processo de setup e operação segura da Calandra CNC **Haeusler VRM-250** para conformação de chapas de aço inoxidável.

## Pré-requisitos
- Habilitação em NR-12 atualizada
- Conhecimento básico de CNC
- EPI: luvas de raspa, óculos e protetor auricular

## Procedimento de Setup
1. Verificar nível de óleo hidráulico (mínimo 3/4 da visória)
2. Ligar painel e aguardar autocheck do CNC (≈ 30 segundos)
3. Inserir programa conforme Ordem de Produção
4. Calibrar rolos com gabarito de espessura
5. Realizar conformação teste em retalho da mesma espessura

## Parâmetros Típicos
| Material | Espessura | Força (bar) | Velocidade |
|---|---|---|---|
| AISI 304 | 3mm | 120 | 4 m/min |
| AISI 316L | 5mm | 180 | 3 m/min |
| AISI 316L | 8mm | 240 | 2 m/min |`,
    anexos: [
      { nome: 'Manual_Haeusler_VRM250_PT.pdf', tamanho: '8,4 MB' },
      { nome: 'Ficha_Setup_Calandra.xlsx', tamanho: '32 KB' },
    ],
    historico: [
      { versao: '2.0', data: '2026-03-15', autor: 'Pedro Prod.', descricao: 'Adição de tabela de parâmetros por material e espessura' },
      { versao: '1.0', data: '2026-02-01', autor: 'Pedro Prod.', descricao: 'Versão inicial do procedimento' },
    ],
  },
  {
    id: 'ART-003', titulo: 'Uso de EPIs Obrigatórios na Produção',
    categoria: 3, subcategoria: 'EPIs', autor: 'Maria RH',
    status: 'publicado', visibilidade: 'todos',
    criado: '2025-12-10', atualizado: '2026-01-20', versao: '1.2',
    visualizacoes: 310, curtidas: 45, tags: ['epi', 'segurança', 'nr6', 'obrigatório'],
    resumo: 'Define os EPIs obrigatórios por área e função, com base na NR-6 e no PPRA vigente.',
    conteudo: `## Objetivo
Definir os Equipamentos de Proteção Individual (EPI) obrigatórios por área de trabalho, conforme **NR-6** e PPRA vigente.

## EPIs por Área

### Produção Geral
- 🦺 Colete de identificação
- 👟 Botina de segurança CA ativo
- 🥽 Óculos de proteção incolor

### Soldagem
- 🪖 Máscara de solda automática (escurecimento 9-13)
- 🧤 Luvas de raspa (cano longo)
- 👔 Avental de couro
- 👟 Botina com biqueira de aço

### Esmerilhamento
- 🥽 Óculos ampla visão
- 🎧 Protetor auricular (mínimo NPS 20 dB)
- 🧤 Luvas de vaqueta`,
    anexos: [{ nome: 'Tabela_EPIs_por_Funcao.pdf', tamanho: '120 KB' }],
    historico: [
      { versao: '1.2', data: '2026-01-20', autor: 'Maria RH',    descricao: 'Atualização dos CAs dos EPIs conforme novos fornecedores' },
      { versao: '1.1', data: '2025-12-22', autor: 'Maria RH',    descricao: 'Inclusão da área de esmerilhamento' },
      { versao: '1.0', data: '2025-12-10', autor: 'Maria RH',    descricao: 'Versão inicial' },
    ],
  },
  {
    id: 'ART-004', titulo: 'Como Elaborar uma Proposta Comercial',
    categoria: 4, subcategoria: 'Propostas', autor: 'Ana Comercial',
    status: 'rascunho', visibilidade: 'interno',
    criado: '2026-04-28', atualizado: '2026-05-01', versao: '0.2',
    visualizacoes: 12, curtidas: 2, tags: ['proposta', 'comercial', 'vendas'],
    resumo: 'Guia passo a passo para elaboração de propostas comerciais alinhadas ao padrão Nomus ERP.',
    conteudo: `## Em elaboração...`,
    anexos: [],
    historico: [
      { versao: '0.2', data: '2026-05-01', autor: 'Ana Comercial', descricao: 'Adição de seção sobre precificação' },
      { versao: '0.1', data: '2026-04-28', autor: 'Ana Comercial', descricao: 'Esboço inicial' },
    ],
  },
  {
    id: 'ART-005', titulo: 'Procedimento de Passivação de Aço Inoxidável',
    categoria: 1, subcategoria: 'Ensaios', autor: 'Carlos Eng.',
    status: 'publicado', visibilidade: 'interno',
    criado: '2026-03-05', atualizado: '2026-03-05', versao: '1.0',
    visualizacoes: 67, curtidas: 9, tags: ['passivação', 'inox', 'tratamento', 'ASTM A380'],
    resumo: 'Procedimento de passivação química de aço inoxidável conforme ASTM A380 para superfícies de contato com alimentos e produtos farmacêuticos.',
    conteudo: `## Objetivo
Definir o processo de passivação química de aço inoxidável conforme **ASTM A380** para restaurar a camada protetora de óxido de cromo.

## Soluções Aprovadas
- Ácido nítrico 20–25% (temperatura ambiente, 30 min)
- Ácido cítrico 4–10% (temperatura ambiente, 20 min — preferencialmente para indústria farmacêutica)

## Sequência de Operações
1. Limpeza com detergente alcalino neutro e água deionizada
2. Enxágue completo (condutividade ≤ 10 µS/cm)
3. Aplicação da solução passivante por imersão ou spray
4. Tempo de contato conforme tabela acima
5. Enxágue final com água deionizada
6. Secagem com ar filtrado sem óleo`,
    anexos: [{ nome: 'ASTM_A380_Resumo.pdf', tamanho: '210 KB' }],
    historico: [{ versao: '1.0', data: '2026-03-05', autor: 'Carlos Eng.', descricao: 'Versão inicial' }],
  },
];

const STATUS_COR = {
  publicado: 'erp-badge-success',
  rascunho:  'erp-badge-warning',
  revisao:   'erp-badge-info',
  arquivado: 'erp-badge-danger',
};

// Renderiza markdown básico
function RenderMarkdown({ md }) {
  const html = md
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-4 mb-1 text-foreground">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-0.5 text-foreground">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-muted/30 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/^\| (.+) \|$/gm, (m) => {
      const cells = m.split('|').filter(Boolean).map((c) => c.trim());
      return `<tr>${cells.map((c) => `<td class="border border-border px-2 py-1">${c}</td>`).join('')}</tr>`;
    })
    .replace(/^---$/gm, '')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br/>');
  return <div className="text-xs leading-relaxed text-foreground/80 space-y-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function BaseConhecimento() {
  const [aba, setAba] = useState('home');
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [artigoSel, setArtigoSel] = useState(null);
  const [abaArtigo, setAbaArtigo] = useState('conteudo');
  const [categoriaExp, setCategoriaExp] = useState({});
  const [showNovoArtigo, setShowNovoArtigo] = useState(false);
  const [showNovaCategoria, setShowNovaCategoria] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [conteudoEdit, setConteudoEdit] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [artigos, setArtigos] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, arts] = await Promise.all([listCategories(), listArticles()]);
      setCategorias((cats ?? []).map((c) => ({
          id: c.id,
          nome: c.name,
          icone: c.icon || '📁',
          cor: c.color || 'bg-gray-100 text-gray-700 border-gray-200',
          descricao: c.description || '',
          subcategorias: [],
          _count: c._count,
        })));
      setArtigos((arts ?? []).map((a) => ({
          id: a.id,
          titulo: a.title,
          categoria: a.categoryId,
          subcategoria: a.subcategory || '',
          autor: a.author || 'Sistema',
          status: a.status,
          visibilidade: a.visibility,
          criado: a.createdAt?.slice(0, 10),
          atualizado: a.updatedAt?.slice(0, 10),
          versao: a.version,
          visualizacoes: a.views,
          curtidas: a.likes,
          tags: Array.isArray(a.tags) ? a.tags : [],
          resumo: a.summary || '',
          conteudo: a.content || '',
          historico: (a.revisions || []).map((r) => ({
            data: r.createdAt?.slice(0, 10),
            autor: r.author || 'Sistema',
            versao: r.version,
            descricao: r.description || '',
          })),
          anexos: (a.attachments || []).map((at) => ({
            nome: at.fileName,
            tamanho: at.fileSize || '',
            data: at.createdAt?.slice(0, 10),
          })),
        })));
    } catch {
      // keep mock on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const artigosFiltrados = useMemo(() => artigos.filter((a) => {
    if (filtroCategoria && a.categoria !== filtroCategoria) return false;
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
    if (busca) {
      const b = busca.toLowerCase();
      return a.titulo.toLowerCase().includes(b) || a.resumo.toLowerCase().includes(b) || a.tags.some((t) => t.includes(b));
    }
    return true;
  }), [filtroCategoria, filtroStatus, busca]);

  const abrirArtigo = (a) => { setArtigoSel(a); setAba('artigo'); setAbaArtigo('conteudo'); setModoEdicao(false); setConteudoEdit(a.conteudo); };

  const ABAS_NAV = [
    { id: 'home',       label: '🏠 Início' },
    { id: 'busca',      label: '🔍 Busca Avançada' },
    { id: 'categorias', label: '📁 Categorias' },
    ...(artigoSel ? [{ id: 'artigo', label: `📄 ${artigoSel.id}` }] : []),
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen size={20} className="text-primary" />Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Procedimentos, instruções de trabalho e políticas internas da fábrica</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowNovaCategoria(true)} className="erp-btn-ghost text-xs flex items-center gap-1.5"><Folder size={13} />Nova Categoria</button>
          <button type="button" onClick={() => setShowNovoArtigo(true)} className="erp-btn text-xs flex items-center gap-1.5"><Plus size={13} />Novo Artigo</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de Artigos', val: artigos.length, sub: `${artigos.filter((a) => a.status === 'publicado').length} publicados`, icon: <FileText size={14} className="text-primary" /> },
          { label: 'Categorias', val: categorias.length, sub: 'áreas organizadas', icon: <Folder size={14} className="text-blue-600" /> },
          { label: 'Visualizações', val: artigos.reduce((s, a) => s + a.visualizacoes, 0), sub: 'este mês', icon: <Eye size={14} className="text-green-600" /> },
          { label: 'Mais Popular', val: artigos.sort((a, b) => b.visualizacoes - a.visualizacoes)[0]?.titulo.split(' ').slice(0, 3).join(' ') + '...', sub: `${Math.max(...artigos.map((a) => a.visualizacoes))} visualizações`, icon: <Star size={14} className="text-yellow-500" /> },
        ].map((k) => (
          <div key={k.label} className="erp-card p-3 flex items-center gap-3">{k.icon}<div><p className="text-[10px] text-muted-foreground">{k.label}</p><p className="font-bold text-sm leading-tight">{k.val}</p><p className="text-[10px] text-muted-foreground">{k.sub}</p></div></div>
        ))}
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-0 overflow-x-auto">
        {ABAS_NAV.map((a) => (
          <button key={a.id} type="button" onClick={() => setAba(a.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${aba === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── HOME ─────────────────────────────────────────────────── */}
      {aba === 'home' && (
        <div className="space-y-5">
          {/* Busca rápida */}
          <div className="erp-card p-5 text-center space-y-3 bg-gradient-to-br from-primary/5 to-blue-50">
            <p className="text-base font-bold">Como podemos ajudá-lo hoje?</p>
            <div className="relative max-w-lg mx-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="erp-input pl-9 w-full" placeholder="Pesquisar procedimentos, instruções de trabalho..." value={busca}
                onChange={(e) => { setBusca(e.target.value); if (e.target.value) setAba('busca'); }} />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {['solda', 'epi', 'setup', 'inox', 'cnc', 'proposta'].map((t) => (
                <button key={t} type="button" onClick={() => { setBusca(t); setAba('busca'); }}
                  className="px-3 py-1 bg-white border border-border rounded-full text-xs text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Categorias em destaque */}
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Navegar por Categoria</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categorias.map((cat) => (
                <button key={cat.id} type="button" onClick={() => { setFiltroCategoria(cat.id); setAba('busca'); }}
                  className={`erp-card p-4 text-left border hover:shadow-md transition-shadow ${cat.cor}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{cat.icone}</span>
                    <p className="font-bold text-sm">{cat.nome}</p>
                  </div>
                  <p className="text-[10px] opacity-70 line-clamp-2">{cat.descricao}</p>
                  <p className="text-[10px] font-semibold mt-2">{artigos.filter((a) => a.categoria === cat.id).length} artigos</p>
                </button>
              ))}
            </div>
          </div>

          {/* Artigos recentes */}
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Artigos Recentes</p>
            <div className="space-y-2">
              {[...ARTIGOS].sort((a, b) => b.atualizado.localeCompare(a.atualizado)).slice(0, 4).map((art) => {
                const cat = categorias.find((c) => c.id === art.categoria);
                return (
                  <div key={art.id} onClick={() => abrirArtigo(art)}
                    className="erp-card p-3 flex items-start gap-3 cursor-pointer hover:shadow-sm transition-shadow group">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm shrink-0 ${cat?.cor}`}>{cat?.icone}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{art.titulo}</p>
                        <span className={`erp-badge ${STATUS_COR[art.status]} text-[9px]`}>{art.status}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{art.resumo}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{cat?.nome} · {art.subcategoria}</span><span>v{art.versao}</span><span>Atualizado {art.atualizado}</span><span className="flex items-center gap-0.5"><Eye size={9} />{art.visualizacoes}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1 group-hover:text-primary" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mais visualizados */}
          <div>
            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Mais Visualizados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...ARTIGOS].sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 4).map((art, i) => (
                <div key={art.id} onClick={() => abrirArtigo(art)}
                  className="erp-card p-3 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow group">
                  <span className={`text-base font-black w-5 shrink-0 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>#{i + 1}</span>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold line-clamp-1 group-hover:text-primary">{art.titulo}</p><p className="text-[10px] text-muted-foreground">{art.visualizacoes} visualizações · {art.curtidas} curtidas</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BUSCA AVANÇADA ──────────────────────────────────────── */}
      {aba === 'busca' && (
        <div className="space-y-3">
          <div className="erp-card p-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <label className="erp-label">Pesquisar</label>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className="erp-input pl-8 w-full" placeholder="Palavras-chave, título, tag..." value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="erp-label">Categoria</label>
              <select className="erp-input" value={filtroCategoria || ''} onChange={(e) => setFiltroCategoria(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Todas</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Status</label>
              <select className="erp-input" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="publicado">Publicado</option>
                <option value="rascunho">Rascunho</option>
                <option value="revisao">Em Revisão</option>
              </select>
            </div>
            <button type="button" onClick={() => { setBusca(''); setFiltroCategoria(null); setFiltroStatus('todos'); }} className="erp-btn-ghost text-xs">Limpar</button>
          </div>

          <p className="text-xs text-muted-foreground">{artigosFiltrados.length} artigo(s) encontrado(s){busca && ` para "${busca}"`}</p>

          <div className="space-y-2">
            {artigosFiltrados.map((art) => {
              const cat = categorias.find((c) => c.id === art.categoria);
              return (
                <div key={art.id} onClick={() => abrirArtigo(art)}
                  className="erp-card p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow group">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${cat?.cor}`}>{cat?.icone}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">{art.titulo}</p>
                      <span className={`erp-badge ${STATUS_COR[art.status]} text-[9px]`}>{art.status}</span>
                      {art.visibilidade === 'todos' ? <Globe size={10} className="text-green-600" /> : <Lock size={10} className="text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{art.resumo}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px]">
                      <span className="text-muted-foreground">{cat?.nome} · {art.subcategoria}</span>
                      <span className="font-mono bg-muted/20 px-1.5 rounded">v{art.versao}</span>
                      <span className="text-muted-foreground">Por {art.autor}</span>
                      <span className="text-muted-foreground">Atualizado {art.atualizado}</span>
                      <span className="flex items-center gap-0.5 text-muted-foreground"><Eye size={9} />{art.visualizacoes}</span>
                      <span className="flex items-center gap-0.5 text-muted-foreground"><ThumbsUp size={9} />{art.curtidas}</span>
                      <div className="flex gap-1">{art.tags.map((t) => <span key={t} className="bg-primary/10 text-primary px-1.5 rounded-full">{t}</span>)}</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1.5 group-hover:text-primary" />
                </div>
              );
            })}
            {artigosFiltrados.length === 0 && (
              <div className="erp-card p-12 text-center">
                <Search size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-semibold">Nenhum artigo encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">Tente outros termos ou crie um novo artigo.</p>
                <button type="button" onClick={() => setShowNovoArtigo(true)} className="erp-btn text-xs mt-4 flex items-center gap-1.5 mx-auto"><Plus size={12} />Criar Artigo</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CATEGORIAS ──────────────────────────────────────────── */}
      {aba === 'categorias' && (
        <div className="space-y-3">
          {categorias.map((cat) => {
            const artigosCat = artigos.filter((a) => a.categoria === cat.id);
            const exp = categoriaExp[cat.id];
            return (
              <div key={cat.id} className="erp-card overflow-hidden">
                <div className={`px-4 py-3 flex items-center justify-between cursor-pointer border-b border-border/40 ${cat.cor}`}
                  onClick={() => setCategoriaExp((p) => ({ ...p, [cat.id]: !p[cat.id] }))}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icone}</span>
                    <div><p className="font-bold text-sm">{cat.nome}</p><p className="text-[10px] opacity-70">{cat.descricao}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold">{artigosCat.length} artigos</span>
                    {exp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </div>
                {exp && (
                  <div className="divide-y divide-border/20">
                    {artigosCat.length === 0
                      ? <div className="p-6 text-center text-xs text-muted-foreground">Nenhum artigo nesta categoria.</div>
                      : artigosCat.map((art) => (
                        <div key={art.id} onClick={() => abrirArtigo(art)}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-muted/10 cursor-pointer group">
                          <FileText size={14} className="text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2"><p className="text-xs font-semibold group-hover:text-primary">{art.titulo}</p><span className={`erp-badge ${STATUS_COR[art.status]} text-[8px]`}>{art.status}</span></div>
                            <p className="text-[10px] text-muted-foreground">{art.subcategoria} · v{art.versao} · {art.atualizado}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0"><Eye size={9} />{art.visualizacoes}<ChevronRight size={12} className="group-hover:text-primary" /></div>
                        </div>
                      ))
                    }
                    <div className="px-4 py-2 bg-muted/5 flex gap-2">
                      <button type="button" onClick={() => { setShowNovoArtigo(true); }} className="erp-btn-ghost text-[10px] flex items-center gap-1"><Plus size={10} />Novo artigo em {cat.nome}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ARTIGO ──────────────────────────────────────────────── */}
      {aba === 'artigo' && artigoSel && (() => {
        const art = artigoSel;
        const cat = categorias.find((c) => c.id === art.categoria);
        const ABAS_A = [
          { id: 'conteudo',  label: 'Conteúdo' },
          { id: 'historico', label: `Histórico (${art.historico.length})` },
          { id: 'anexos',    label: `Anexos (${art.anexos.length})` },
        ];
        return (
          <div className="space-y-3">
            {/* Cabeçalho artigo */}
            <div className="erp-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <button type="button" onClick={() => setAba('home')} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /></button>
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${cat?.cor}`}>{cat?.icone}</div>
                    <span className="text-xs text-muted-foreground">{cat?.nome} / {art.subcategoria}</span>
                    <span className={`erp-badge ${STATUS_COR[art.status]} text-[9px]`}>{art.status}</span>
                    <span className="font-mono text-[10px] bg-muted/20 px-1.5 py-0.5 rounded">v{art.versao}</span>
                    {art.visibilidade === 'todos' ? <span className="flex items-center gap-0.5 text-[9px] text-green-700"><Globe size={9} />Público</span> : <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground"><Lock size={9} />Interno</span>}
                  </div>
                  <h2 className="text-xl font-bold">{art.titulo}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{art.resumo}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>Por <strong>{art.autor}</strong></span>
                    <span>Criado: {art.criado}</span>
                    <span>Atualizado: {art.atualizado}</span>
                    <span className="flex items-center gap-0.5"><Eye size={9} />{art.visualizacoes} visualizações</span>
                    <span className="flex items-center gap-0.5"><ThumbsUp size={9} />{art.curtidas} curtidas</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {art.tags.map((t) => <span key={t} className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => toast.info('Imprimindo...')} className="erp-btn-ghost p-1.5 text-xs" title="Imprimir"><Printer size={14} /></button>
                  <button type="button" onClick={() => toast.info('Download...')} className="erp-btn-ghost p-1.5 text-xs" title="Download"><Download size={14} /></button>
                  <button type="button" onClick={() => setModoEdicao(!modoEdicao)} className={`erp-btn${modoEdicao ? '' : '-ghost'} text-xs flex items-center gap-1.5`}><Pencil size={12} />{modoEdicao ? 'Editar' : 'Editar'}</button>
                </div>
              </div>
            </div>

            {/* Sub-abas artigo */}
            <div className="border-b border-border flex gap-0">
              {ABAS_A.map((a) => (
                <button key={a.id} type="button" onClick={() => setAbaArtigo(a.id)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${abaArtigo === a.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{a.label}</button>
              ))}
            </div>

            {/* ── Conteúdo ── */}
            {abaArtigo === 'conteudo' && (
              <div className="erp-card p-6">
                {modoEdicao ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-muted-foreground">Editando em Markdown</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setModoEdicao(false)} className="erp-btn-ghost text-xs">Cancelar</button>
                        <button type="button" onClick={() => { toast.success('Rascunho salvo!'); }} className="erp-btn-ghost text-xs">Salvar Rascunho</button>
                        <button type="button" onClick={() => { toast.success('Nova versão publicada: v' + (Number(art.versao) + 0.1).toFixed(1)); setModoEdicao(false); }} className="erp-btn text-xs">Publicar Nova Versão</button>
                      </div>
                    </div>
                    <textarea className="erp-input w-full font-mono text-xs" rows={20} value={conteudoEdit} onChange={(e) => setConteudoEdit(e.target.value)} />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <RenderMarkdown md={art.conteudo} />
                  </div>
                )}
                {!modoEdicao && (
                  <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">Este artigo foi útil?</p>
                    <button type="button" onClick={() => toast.success('Obrigado pelo feedback!')} className="erp-btn-ghost text-xs flex items-center gap-1"><ThumbsUp size={12} />Sim ({art.curtidas})</button>
                    <button type="button" onClick={() => toast.info('Feedback registrado.')} className="erp-btn-ghost text-xs flex items-center gap-1"><ThumbsDown size={12} />Não</button>
                  </div>
                )}
              </div>
            )}

            {/* ── Histórico de Alterações ── */}
            {abaArtigo === 'historico' && (
              <div className="erp-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold flex items-center gap-2">
                  <History size={13} className="text-primary" />Histórico de Alterações — Controle de Versão
                </div>
                <div className="divide-y divide-border/20">
                  {art.historico.map((h, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ${i === 0 ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground'}`}>v{h.versao}</div>
                        {i < art.historico.length - 1 && <div className="w-0.5 h-6 bg-border/40" />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-primary">v{h.versao}</span>
                          {i === 0 && <span className="erp-badge erp-badge-success text-[8px]">versão atual</span>}
                          <span className="text-[10px] text-muted-foreground">{h.data}</span>
                          <span className="text-[10px] text-muted-foreground">por <strong>{h.autor}</strong></span>
                        </div>
                        <p className="text-xs mt-0.5">{h.descricao}</p>
                        {i > 0 && <button type="button" onClick={() => toast.info(`Visualizando v${h.versao}`)} className="erp-btn-ghost text-[10px] mt-1 py-0 px-2 h-5">Visualizar esta versão</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Anexos ── */}
            {abaArtigo === 'anexos' && (
              <div className="erp-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold flex items-center gap-2"><Paperclip size={13} className="text-primary" />Arquivos Anexados</p>
                  <button type="button" onClick={() => toast.info('Upload simulado!')} className="erp-btn text-xs flex items-center gap-1"><Plus size={11} />Anexar Arquivo</button>
                </div>
                {art.anexos.length === 0
                  ? <div className="border border-dashed border-border rounded-lg p-8 text-center text-xs text-muted-foreground">Nenhum arquivo anexado.</div>
                  : <div className="space-y-2">
                    {art.anexos.map((an, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted/10 border border-border rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-2"><FileText size={14} className="text-muted-foreground" /><span className="text-xs font-medium">{an.nome}</span></div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground"><span>{an.tamanho}</span><button type="button" onClick={() => toast.info('Download simulado!')} className="erp-btn-ghost text-[10px] py-0.5 px-2 flex items-center gap-0.5"><Download size={10} />Baixar</button></div>
                      </div>
                    ))}
                  </div>}
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal Novo Artigo */}
      {showNovoArtigo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-white">
              <p className="font-semibold flex items-center gap-2"><FileText size={15} />Novo Artigo / Procedimento</p>
              <button type="button" onClick={() => setShowNovoArtigo(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="erp-label">Título do Artigo / Procedimento</label><input className="erp-input w-full" placeholder="Ex.: Procedimento de Inspeção Visual de Soldas" /></div>
                <div><label className="erp-label">Categoria</label><select className="erp-input w-full">{categorias.map((c) => <option key={c.id}>{c.icone} {c.nome}</option>)}</select></div>
                <div><label className="erp-label">Subcategoria</label><input className="erp-input w-full" placeholder="Ex.: Inspeção de Materiais" /></div>
                <div><label className="erp-label">Responsável / Autor</label><input className="erp-input w-full" defaultValue="Carlos Eng." /></div>
                <div><label className="erp-label">Visibilidade</label><select className="erp-input w-full"><option>interno</option><option>todos</option></select></div>
                <div className="col-span-2"><label className="erp-label">Resumo</label><input className="erp-input w-full" placeholder="Breve descrição do procedimento..." /></div>
                <div className="col-span-2"><label className="erp-label">Tags (separadas por vírgula)</label><input className="erp-input w-full" placeholder="solda, inspeção, visual" /></div>
                <div className="col-span-2">
                  <label className="erp-label">Conteúdo (Markdown)</label>
                  <textarea className="erp-input w-full font-mono text-xs" rows={10}
                    placeholder={`## Objetivo\nDescreva o objetivo deste procedimento.\n\n## Procedimento\n1. Passo 1\n2. Passo 2\n\n## Critérios de Aceitação\n...`} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNovoArtigo(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Artigo salvo como rascunho!'); setShowNovoArtigo(false); }} className="erp-btn-ghost flex-1">Salvar Rascunho</button>
                <button type="button" onClick={() => { toast.success('Artigo publicado com sucesso!'); setShowNovoArtigo(false); }} className="erp-btn flex-1">Publicar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {showNovaCategoria && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold flex items-center gap-2"><Folder size={15} />Nova Categoria</p>
              <button type="button" onClick={() => setShowNovaCategoria(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="erp-label">Ícone (emoji)</label><input className="erp-input w-full text-xl text-center" defaultValue="📋" /></div>
                <div><label className="erp-label">Nome da Categoria</label><input className="erp-input w-full" placeholder="Ex.: Manutenção" /></div>
                <div className="col-span-2"><label className="erp-label">Descrição</label><input className="erp-input w-full" placeholder="Breve descrição do que esta categoria abrange..." /></div>
                <div className="col-span-2"><label className="erp-label">Subcategorias (separadas por vírgula)</label><input className="erp-input w-full" placeholder="Preventiva, Corretiva, Preditiva" /></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNovaCategoria(false)} className="erp-btn-ghost flex-1">Cancelar</button>
                <button type="button" onClick={() => { toast.success('Categoria criada!'); setShowNovaCategoria(false); }} className="erp-btn flex-1">Criar Categoria</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
