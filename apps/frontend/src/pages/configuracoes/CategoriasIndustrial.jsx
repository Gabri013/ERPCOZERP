import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { metaCodeApi } from '@/services/metaCodeApi';
import { invalidateIndustrialCategoryCache } from '@/components/industrial/IndustrialCategoryBadge';
import { toast } from 'sonner';

const inp = 'w-full border border-border rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-primary';
const lbl = 'block text-[11px] text-muted-foreground mb-0.5 font-medium';

const ENTITIES = [
  { value: 'produto', label: 'Produto (entity_record)' },
  { value: 'ordem_producao', label: 'OP legado (entity_record)' },
  { value: 'pedido_venda', label: 'Pedido venda (entity_record)' },
  { value: 'work_order', label: 'OP WorkOrder (PostgreSQL)' },
];

const FORMATS = [
  { value: 'CAT_PREFIX_YM_SEQ', label: 'CAT-PREFIX-AAAAMM-seq (ex.: COC-PRD-202605-00001)' },
  { value: 'PREFIX_CAT_YM_SEQ', label: 'PREFIX-CAT-AAAAMM-seq (ex.: OP-MOB-202605-00001)' },
  { value: 'PREFIX_YEAR_SEQ', label: 'PREFIX-ANO-seq (ex.: PED-2026-000001)' },
];

export default function CategoriasIndustrial() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [ruleEntity, setRuleEntity] = useState('work_order');
  const [ruleForm, setRuleForm] = useState(null);

  const loadCats = useCallback(async () => {
    setLoading(true);
    try {
      setCats(await metaCodeApi.listCategoriesAll());
    } catch (e) {
      toast.error(e?.message || 'Falha ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRule = useCallback(async (entity) => {
    const r = await metaCodeApi.getRule(entity);
    setRuleForm(r);
  }, []);

  useEffect(() => {
    loadCats();
  }, [loadCats]);

  useEffect(() => {
    loadRule(ruleEntity);
  }, [ruleEntity, loadRule]);

  const saveCat = async (row, patch) => {
    setSavingId(row.id);
    try {
      await metaCodeApi.saveCategory({ ...row, ...patch });
      invalidateIndustrialCategoryCache();
      toast.success('Categoria atualizada');
      await loadCats();
    } catch (e) {
      toast.error(e?.message || 'Falha ao gravar');
    } finally {
      setSavingId(null);
    }
  };

  const saveRule = async () => {
    if (!ruleForm) return;
    try {
      await metaCodeApi.saveRule({
        entity: ruleForm.entity,
        prefix: ruleForm.prefix,
        categoriaField: ruleForm.categoriaField,
        useYear: ruleForm.useYear,
        useMonth: ruleForm.useMonth,
        sequencePadding: ruleForm.sequencePadding,
        resetType: ruleForm.resetType,
        format: ruleForm.format,
        targetField: ruleForm.targetField,
        fallbackCategoryCode: ruleForm.fallbackCategoryCode,
        active: ruleForm.active,
      });
      toast.success('Regra gravada');
      await loadRule(ruleEntity);
    } catch (e) {
      toast.error(e?.message || 'Falha ao gravar regra');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias industriais"
        breadcrumbs={['Início', 'Configurações', 'Categorias']}
        subtitle="Cores e siglas usadas em OP, Kanban e códigos inteligentes. Regras de código: formato por entidade."
      />

      <div className="bg-white border border-border rounded-lg p-4 space-y-4">
        <h2 className="text-sm font-semibold">Regra de código por entidade</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Entidade</label>
            <select className={inp} value={ruleEntity} onChange={(e) => setRuleEntity(e.target.value)}>
              {ENTITIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {ruleForm && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className={lbl}>Prefixo (ex.: OP, PRD, PED)</label>
              <input className={inp} value={ruleForm.prefix || ''} onChange={(e) => setRuleForm((r) => ({ ...r, prefix: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Campo categoria (JSON / produto)</label>
              <input
                className={inp}
                value={ruleForm.categoriaField || ''}
                onChange={(e) => setRuleForm((r) => ({ ...r, categoriaField: e.target.value || null }))}
                placeholder="categoria_industrial, group…"
              />
            </div>
            <div>
              <label className={lbl}>Campo alvo (código gravado)</label>
              <input className={inp} value={ruleForm.targetField || ''} onChange={(e) => setRuleForm((r) => ({ ...r, targetField: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Formato</label>
              <select className={inp} value={ruleForm.format} onChange={(e) => setRuleForm((r) => ({ ...r, format: e.target.value }))}>
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Reset sequência</label>
              <select className={inp} value={ruleForm.resetType} onChange={(e) => setRuleForm((r) => ({ ...r, resetType: e.target.value }))}>
                <option value="month">Mês (com ano)</option>
                <option value="year">Ano</option>
                <option value="never">Nunca</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Padding numérico</label>
              <input
                type="number"
                min={1}
                max={12}
                className={inp}
                value={ruleForm.sequencePadding}
                onChange={(e) => setRuleForm((r) => ({ ...r, sequencePadding: Number(e.target.value) }))}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!ruleForm.useYear} onChange={(e) => setRuleForm((r) => ({ ...r, useYear: e.target.checked }))} />
              Usar ano no período
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!ruleForm.useMonth} onChange={(e) => setRuleForm((r) => ({ ...r, useMonth: e.target.checked }))} />
              Usar mês no período
            </label>
            <div>
              <label className={lbl}>Categoria fallback (sigla)</label>
              <input
                className={inp}
                value={ruleForm.fallbackCategoryCode || ''}
                onChange={(e) => setRuleForm((r) => ({ ...r, fallbackCategoryCode: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!ruleForm.active} onChange={(e) => setRuleForm((r) => ({ ...r, active: e.target.checked }))} />
              Regra ativa
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="button" onClick={saveRule} className="px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
                Gravar regra
              </button>
            </div>
          </div>
        )}
        {!ruleForm && <p className="text-xs text-muted-foreground">Sem regra para esta entidade (migração aplicada?).</p>}
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-border text-sm font-semibold">Categorias (cor / texto)</div>
        {loading ? (
          <p className="p-4 text-xs text-muted-foreground">A carregar…</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Sigla</th>
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-left px-3 py-2">Cor</th>
                <th className="text-left px-3 py-2">Texto</th>
                <th className="text-left px-3 py-2">Ordem</th>
                <th className="text-left px-3 py-2">Ativo</th>
                <th className="text-left px-3 py-2 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((row) => (
                <tr key={row.id} className="border-b border-border">
                  <td className="px-3 py-2 font-mono font-medium">{row.code}</td>
                  <td className="px-3 py-2">
                    <input className={inp} defaultValue={row.label} id={`lbl-${row.id}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={inp} type="color" defaultValue={row.color} id={`bg-${row.id}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className={inp} type="color" defaultValue={row.textColor} id={`fg-${row.id}`} />
                  </td>
                  <td className="px-3 py-2 w-20">
                    <input className={inp} type="number" defaultValue={row.sortOrder} id={`ord-${row.id}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="checkbox" defaultChecked={row.active} id={`act-${row.id}`} />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={savingId === row.id}
                      onClick={() => {
                        const label = document.getElementById(`lbl-${row.id}`)?.value ?? row.label;
                        const color = document.getElementById(`bg-${row.id}`)?.value ?? row.color;
                        const textColor = document.getElementById(`fg-${row.id}`)?.value ?? row.textColor;
                        const sortOrder = Number(document.getElementById(`ord-${row.id}`)?.value ?? row.sortOrder);
                        const active = document.getElementById(`act-${row.id}`)?.checked ?? row.active;
                        saveCat(row, { label, color, textColor, sortOrder, active });
                      }}
                      className="text-[11px] px-2 py-1 border rounded hover:bg-muted"
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
