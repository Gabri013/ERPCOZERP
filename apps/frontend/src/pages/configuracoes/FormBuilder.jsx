import { useCallback, useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { metaApi } from '@/services/metaApi';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

const DATA_TYPES = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'select', label: 'Seleção' },
  { value: 'data', label: 'Data' },
  { value: 'checkbox', label: 'Checkbox' },
];

const emptyEditor = {
  id: null,
  fieldCode: '',
  label: '',
  dataType: 'texto',
  required: false,
  optionsJson: '{\n  "choices": [\n    { "value": "a", "label": "Opção A" },\n    { "value": "b", "label": "Opção B" }\n  ]\n}',
  active: true,
};

function parseOptionsJson(text) {
  const t = String(text || '').trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    throw new Error('JSON de opções inválido (necessário para tipo seleção).');
  }
}

export default function FormBuilder() {
  const [entityCode, setEntityCode] = useState('crm_lead');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState(emptyEditor);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await metaApi.listFields(entityCode.trim() || 'crm_lead', { includeInactive: true });
      setFields([...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    } catch (e) {
      toast.error(e?.message || 'Falha ao carregar campos');
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [entityCode]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditor({ ...emptyEditor, fieldCode: '', label: '' });
    setEditorOpen(true);
  };

  const openEdit = (row) => {
    setEditor({
      id: row.id,
      fieldCode: row.fieldCode,
      label: row.label,
      dataType: row.dataType,
      required: !!row.required,
      optionsJson: row.options ? JSON.stringify(row.options, null, 2) : emptyEditor.optionsJson,
      active: row.active !== false,
    });
    setEditorOpen(true);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const next = Array.from(fields);
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    setFields(next);
    try {
      for (let i = 0; i < next.length; i += 1) {
        await metaApi.update(next[i].id, 'field', { sortOrder: i });
      }
      toast.success('Ordem atualizada');
      await load();
    } catch (e) {
      toast.error(e?.message || 'Falha ao reordenar');
      await load();
    }
  };

  const handleSaveEditor = async () => {
    const ec = entityCode.trim() || 'crm_lead';
    const fc = String(editor.fieldCode || '').trim();
    const lb = String(editor.label || '').trim();
    if (!fc || !lb) {
      toast.error('Código e rótulo do campo são obrigatórios.');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fc)) {
      toast.error('Código: use letras, números e underscore (ex.: segmento_mercado).');
      return;
    }
    let options;
    if (editor.dataType === 'select') {
      try {
        options = parseOptionsJson(editor.optionsJson);
      } catch (err) {
        toast.error(err?.message || 'Opções inválidas');
        return;
      }
    }
    setSaving(true);
    try {
      if (editor.id) {
        await metaApi.update(editor.id, 'field', {
          label: lb,
          dataType: editor.dataType,
          required: editor.required,
          active: editor.active,
          ...(editor.dataType === 'select' ? { options } : { options: null }),
        });
        toast.success('Campo atualizado');
      } else {
        await metaApi.create('field', {
          entityCode: ec,
          fieldCode: fc,
          label: lb,
          dataType: editor.dataType,
          required: editor.required,
          sortOrder: fields.length,
          ...(editor.dataType === 'select' && options ? { options } : {}),
        });
        toast.success('Campo criado');
      }
      setEditorOpen(false);
      await load();
    } catch (e) {
      toast.error(e?.message || 'Falha ao gravar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Remover o campo "${row.label}" (${row.fieldCode})?`)) return;
    try {
      await metaApi.remove(row.id, 'field');
      toast.success('Campo removido');
      await load();
    } catch (e) {
      toast.error(e?.message || 'Falha ao remover');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Form Builder (No-code)"
        breadcrumbs={['Início', 'Configurações', 'Form Builder']}
        subtitle="Campos dinâmicos por entidade — valores gravados no JSON do registo (EntityRecord)."
      />

      <div className="flex flex-wrap gap-3 items-end bg-white border border-border rounded-lg p-4">
        <div className="min-w-[200px] flex-1">
          <label className={lbl}>Código da entidade</label>
          <input
            className={inp}
            value={entityCode}
            onChange={(e) => setEntityCode(e.target.value)}
            placeholder="crm_lead"
          />
        </div>
        <button type="button" onClick={() => load()} className="h-8 px-3 text-xs border border-border rounded hover:bg-muted">
          Recarregar
        </button>
        <button
          type="button"
          onClick={openNew}
          className="h-8 px-3 text-xs cozinha-blue-bg text-white rounded hover:opacity-90 flex items-center gap-1"
        >
          <Plus size={14} /> Novo campo
        </button>
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        {loading ? (
          <p className="p-6 text-xs text-muted-foreground">A carregar…</p>
        ) : fields.length === 0 ? (
          <p className="p-6 text-xs text-muted-foreground">Sem campos definidos. Crie o primeiro ou altere o código da entidade.</p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="meta-fields">
              {(provided) => (
                <ul ref={provided.innerRef} {...provided.droppableProps} className="divide-y divide-border">
                  {fields.map((row, index) => (
                    <Draggable key={row.id} draggableId={row.id} index={index}>
                      {(p) => (
                        <li ref={p.innerRef} {...p.draggableProps} className={`flex items-center gap-2 px-3 py-2.5 text-xs ${row.active ? '' : 'opacity-50'}`}>
                          <span {...p.dragHandleProps} className="text-muted-foreground cursor-grab p-1">
                            <GripVertical size={16} />
                          </span>
                          <div className="flex-1 min-w-0 grid sm:grid-cols-4 gap-2">
                            <div>
                              <span className="text-muted-foreground block text-[10px]">Código</span>
                              <span className="font-mono font-medium">{row.fieldCode}</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-muted-foreground block text-[10px]">Rótulo</span>
                              <span>{row.label}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">Tipo</span>
                              <span>{row.dataType}</span>
                              {row.required ? <span className="ml-1 text-red-500">*</span> : null}
                            </div>
                          </div>
                          <button type="button" className="p-1.5 rounded hover:bg-muted" title="Editar" onClick={() => openEdit(row)}>
                            <Pencil size={14} />
                          </button>
                          <button type="button" className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Remover" onClick={() => handleDelete(row)}>
                            <Trash2 size={14} />
                          </button>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {editorOpen && (
        <FormModal
          title={editor.id ? 'Editar campo' : 'Novo campo'}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveEditor}
          saving={saving}
          size="md"
        >
          <div className="space-y-3">
            {!editor.id && (
              <div>
                <label className={lbl}>Código do campo (JSON) {req}</label>
                <input
                  className={inp}
                  value={editor.fieldCode}
                  onChange={(e) => setEditor((s) => ({ ...s, fieldCode: e.target.value }))}
                  placeholder="ex.: segmento_mercado"
                  disabled={!!editor.id}
                />
              </div>
            )}
            <div>
              <label className={lbl}>Rótulo {req}</label>
              <input className={inp} value={editor.label} onChange={(e) => setEditor((s) => ({ ...s, label: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Tipo</label>
              <select className={inp} value={editor.dataType} onChange={(e) => setEditor((s) => ({ ...s, dataType: e.target.value }))}>
                {DATA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={editor.required} onChange={(e) => setEditor((s) => ({ ...s, required: e.target.checked }))} />
              Obrigatório
            </label>
            {editor.id && (
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" checked={editor.active} onChange={(e) => setEditor((s) => ({ ...s, active: e.target.checked }))} />
                Ativo (visível nos formulários)
              </label>
            )}
            {editor.dataType === 'select' && (
              <div>
                <label className={lbl}>Opções (JSON)</label>
                <textarea
                  className={`${inp} font-mono resize-y min-h-[120px]`}
                  value={editor.optionsJson}
                  onChange={(e) => setEditor((s) => ({ ...s, optionsJson: e.target.value }))}
                />
              </div>
            )}
          </div>
        </FormModal>
      )}
    </div>
  );
}
