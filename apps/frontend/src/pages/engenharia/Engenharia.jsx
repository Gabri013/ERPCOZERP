/**
 * Dashboard de Engenharia — visão consolidada de BOM, peso e 3D.
 * - Stats de BOM (EMPTY / PENDING / COMPLETE)
 * - Calculadora de peso de chapa inox
 * - Acesso rápido a Projetos, Pendentes e Visualizador 3D
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productsApi } from '@/services/productsApi';
import { usePermissao } from '@/lib/PermissaoContext';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileSpreadsheet,
  Layers,
  Box,
} from 'lucide-react';

/** Peso chapa inox (kg) — fórmula local: vol m³ × 7850 kg/m³ */
function calcPesoKg(xMm, yMm, eMm) {
  const x = parseFloat(String(xMm).replace(',', '.')) || 0;
  const y = parseFloat(String(yMm).replace(',', '.')) || 0;
  const e = parseFloat(String(eMm).replace(',', '.')) || 0;
  if (!x || !y || !e) return 0;
  const volM3 = (x * y * e) / 1e9;
  return Number((volM3 * 7850).toFixed(4));
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CFG = {
  EMPTY: { label: 'Sem BOM', cls: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  PENDING_ENGINEERING: { label: 'Em elaboração', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  COMPLETE: { label: 'Aprovada', cls: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
};

function BomStatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.EMPTY;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${cfg.cls}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon: Icon, to }) {
  const colors = {
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    green: 'border-green-200 bg-green-50',
    blue: 'border-blue-200 bg-blue-50',
  };
  const textColors = {
    red: 'text-red-800',
    amber: 'text-amber-800',
    green: 'text-green-800',
    blue: 'text-blue-800',
  };
  const content = (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.blue} ${to ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs font-medium opacity-70 uppercase tracking-wide ${textColors[color] || textColors.blue}`}>{label}</p>
        {Icon && <Icon size={16} className={`${textColors[color] || textColors.blue} opacity-60`} />}
      </div>
      <p className={`text-3xl font-bold ${textColors[color] || textColors.blue}`}>{value ?? '—'}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Engenharia() {
  const { pode } = usePermissao();
  const podeBom = pode('editar_produtos');
  const podeVer = pode('ver_roteiros') || pode('ver_estoque');

  // BOM stats
  const [pendentes, setPendentes] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Calculadora de peso
  const [xMm, setXMm] = useState('1000');
  const [yMm, setYMm] = useState('2000');
  const [eMm, setEMm] = useState('1.5');

  const peso = useMemo(() => calcPesoKg(xMm, yMm, eMm), [xMm, yMm, eMm]);

  useEffect(() => {
    let ok = true;
    (async () => {
      setLoadingStats(true);
      try {
        const data = await productsApi.pendingBom();
        if (ok) setPendentes(Array.isArray(data) ? data : []);
      } catch {
        if (ok) setPendentes([]);
      } finally {
        if (ok) setLoadingStats(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  const countEmpty = pendentes.filter((p) => p.bom_status === 'EMPTY').length;
  const countPending = pendentes.filter((p) => p.bom_status === 'PENDING_ENGINEERING').length;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Engenharia"
        subtitle="BOM, peso de chapa, arquivos técnicos e visualização 3D"
      />

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Sem BOM"
          value={loadingStats ? '…' : countEmpty}
          color="red"
          icon={AlertTriangle}
          to="/engenharia/pendentes-bom"
        />
        <StatCard
          label="Em elaboração"
          value={loadingStats ? '…' : countPending}
          color="amber"
          icon={Clock}
          to="/engenharia/pendentes-bom"
        />
        <StatCard
          label="Total pendentes"
          value={loadingStats ? '…' : countEmpty + countPending}
          color="blue"
          icon={ClipboardList}
          to="/engenharia/pendentes-bom"
        />
        <StatCard
          label="Projetos"
          value="→"
          color="green"
          icon={Layers}
          to="/engenharia/projetos"
        />
      </div>

      {/* ── Quick links ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            to: '/engenharia/pendentes-bom',
            icon: AlertTriangle,
            title: 'Produtos pendentes de BOM',
            desc: 'Lista de produtos sem BOM completa — fila do projetista.',
            color: 'text-amber-600',
          },
          {
            to: '/engenharia/projetos',
            icon: FileSpreadsheet,
            title: 'Projetos em desenvolvimento',
            desc: 'Todos os produtos com acesso à BOM, arquivos DXF/PDF e modelo 3D.',
            color: 'text-blue-600',
          },
          {
            to: '/estoque/produtos',
            icon: Box,
            title: 'Catálogo de produtos',
            desc: 'Abra a ficha do produto para importar BOM do SolidWorks.',
            color: 'text-green-600',
          },
        ].map(({ to, icon: Icon, title, desc, color }) => (
          <Link
            key={to}
            to={to}
            className="rounded-lg border border-border bg-card p-4 flex items-start gap-3 hover:border-primary/50 hover:bg-muted/40 transition-colors"
          >
            <Icon size={20} className={`mt-0.5 shrink-0 ${color}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
            </div>
            <ChevronRight size={14} className="ml-auto shrink-0 text-muted-foreground mt-1" />
          </Link>
        ))}
      </div>

      {/* ── Calculadora de peso ───────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Calculadora de peso — chapa de aço inox</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fórmula: (X × Y × espessura) ÷ 10⁹ m³ × 7850 kg/m³ (densidade inox) — dimensões em mm.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-sm">
          <div>
            <Label htmlFor="eng-x" className="text-xs">X (mm)</Label>
            <Input id="eng-x" value={xMm} onChange={(e) => setXMm(e.target.value)} inputMode="decimal" className="h-8 text-xs" />
          </div>
          <div>
            <Label htmlFor="eng-y" className="text-xs">Y (mm)</Label>
            <Input id="eng-y" value={yMm} onChange={(e) => setYMm(e.target.value)} inputMode="decimal" className="h-8 text-xs" />
          </div>
          <div>
            <Label htmlFor="eng-e" className="text-xs">Espessura (mm)</Label>
            <Input id="eng-e" value={eMm} onChange={(e) => setEMm(e.target.value)} inputMode="decimal" className="h-8 text-xs" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted/60 border border-border px-4 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Peso calculado</p>
            <p className="text-xl font-bold text-foreground">
              {peso > 0 ? `${peso} kg` : <span className="text-muted-foreground text-sm">preencha as dimensões</span>}
            </p>
          </div>
          {peso > 0 && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Área: {((parseFloat(xMm) * parseFloat(yMm)) / 1e6).toFixed(4)} m²</p>
              <p>Volume: {((parseFloat(xMm) * parseFloat(yMm) * parseFloat(eMm)) / 1e9).toFixed(8)} m³</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Recent pending list ───────────────────────────────────────────── */}
      {podeVer && pendentes.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pendentes recentes</h2>
            <Link to="/engenharia/pendentes-bom" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {pendentes.slice(0, 5).map((p) => (
              <div
                key={p.record_id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-mono font-semibold">{p.codigo}</span>
                  {p.descricao && (
                    <span className="text-muted-foreground ml-2 truncate">{p.descricao}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <BomStatusBadge status={p.bom_status} />
                  {podeBom && (
                    <Link
                      to={`/estoque/produtos/bom/${p.record_id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      Abrir
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
