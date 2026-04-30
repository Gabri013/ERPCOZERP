import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, GripVertical, ArrowRight } from 'lucide-react';
import { useMetadataStore } from '@/stores/metadataStore';
import { resolveApiUrl } from '@/config/appConfig';

export default function WorkflowBuilder() {
  const { entities, loadEntities } = useMetadataStore();
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [stepForWorkflow, setStepForWorkflow] = useState(null);
  
  const [form, setForm] = useState({
    entity_id: '',
    code: '',
    name: '',
    description: '',
    is_active: true,
    trigger_type: 'manual',
    config: { requireApproval: false, notifyRoles: [] }
  });

  const [stepForm, setStepForm] = useState({
    code: '', label: '', description: '', color: '#6B7280',
    sort_order: 0, is_initial: false, is_final: false,
    approver_roles: [], can_edit_fields: [], required_approval: false
  });

  useEffect(() => {
    loadEntities();
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const res = await fetch(resolveApiUrl('/api/workflows'));
      const json = await res.json();
      if (json.success) setWorkflows(json.data);
    } catch (err) {
      toast.error('Erro ao carregar workflows');
    }
  };

  const handleSave = async () => {
    try {
      const url = selectedWorkflow ? resolveApiUrl(`/api/workflows/${selectedWorkflow.id}`) : resolveApiUrl('/api/workflows');
      const method = selectedWorkflow ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(selectedWorkflow ? 'Atualizado' : 'Criado');
      setShowDialog(false);
      loadWorkflows();
      resetForm();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir workflow?')) return;
    try {
      await fetch(resolveApiUrl(`/api/workflows/${id}`), { method: 'DELETE' });
      toast.success('Excluído');
      loadWorkflows();
    } catch (err) {
      toast.error('Erro ao excluir');
    }
  };

  const handleAddStep = async () => {
    if (!selectedWorkflow) return;
    
    try {
      const res = await fetch(resolveApiUrl(`/api/workflows/${selectedWorkflow.id}/steps`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      toast.success('Etapa adicionada');
      setShowStepDialog(false);
      loadWorkflows();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getEntityName = (entityId) => {
    const ent = entities.find(e => e.id === entityId);
    return ent?.name || '—';
  };

  const resetForm = () => {
    setSelectedWorkflow(null);
    setForm({
      entity_id: '', code: '', name: '', description: '',
      is_active: true, trigger_type: 'manual', config: { requireApproval: false }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Builder</h1>
          <p className="text-muted-foreground">Configure fluxos de aprovação e status</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Workflow
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Etapas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell>{getEntityName(w.entity_id)}</TableCell>
                <TableCell><code>{w.code}</code></TableCell>
                <TableCell>{w.trigger_type}</TableCell>
                <TableCell>{w.is_active ? '✅' : '❌'}</TableCell>
                <TableCell>{w.steps?.length || 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedWorkflow(w);
                      setForm({
                        entity_id: w.entity_id,
                        code: w.code,
                        name: w.name,
                        description: w.description,
                        is_active: w.is_active,
                        trigger_type: w.trigger_type,
                        config: w.config || {}
                      });
                      setShowDialog(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {w.steps?.length === 0 && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(w.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* === Modal Workflow === */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedWorkflow ? 'Editar' : 'Novo'} Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Entidade</Label>
              <select
                value={form.entity_id}
                onChange={(e) => setForm({ ...form, entity_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Selecione</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                <Label>Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.config.requireApproval} onCheckedChange={(c) => setForm({ ...form, config: { ...form.config, requireApproval: c } })} />
                <Label>Requer aprovação</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Etapas === */}
      {selectedWorkflow && (
        <div className="mt-8 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Etapas — {selectedWorkflow.name}</h2>
            <Button onClick={() => { setStepForm({ code: '', label: '', sort_order: (selectedWorkflow.steps?.length || 0) + 1 }); setShowStepDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Etapa
            </Button>
          </div>

          {selectedWorkflow.steps?.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-4">
              {selectedWorkflow.steps.map((step, idx) => (
                <div key={step.id} className="flex items-center bg-muted rounded-lg px-4 py-2 min-w-[140px]">
                  <GripVertical className="h-4 w-4 text-muted-foreground mr-2" />
                  <div>
                    <div className="font-medium text-sm">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.code}</div>
                  </div>
                </div>
              ))}
              <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
