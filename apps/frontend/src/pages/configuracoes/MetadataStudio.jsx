import { apiPost, apiPut, apiDelete } from '@/utils/api';
import { useEffect, useState } from 'react';
import { useMetadataStore } from '@/stores/metadataStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Package,
  Users,
  Settings,
  Factory,
  ShoppingCart,
  Clipboard,
  Truck,
  CreditCard,
  FileText,
  Scroll,
  Layers,
  Box,
} from 'lucide-react';
import { toast } from 'sonner';

const fieldTypeOptions = [
  { id: 'text', label: 'Texto' },
  { id: 'number', label: 'Número' },
  { id: 'textarea', label: 'Área de texto' },
  { id: 'boolean', label: 'Sim/Não' },
  { id: 'date', label: 'Data' },
  { id: 'select', label: 'Seleção' },
  { id: 'multiselect', label: 'Seleção múltipla' },
  { id: 'reference', label: 'Referência' },
  { id: 'currency', label: 'Moeda' },
  { id: 'file', label: 'Arquivo' },
];

export default function MetadataStudio() {
  const { entities, loadEntities, invalidate } = useMetadataStore();
  const [activeTab, setActiveTab] = useState('entities');
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  
  // Form state
  const [entityForm, setEntityForm] = useState({
    code: '', name: '', description: '', icon: 'Package', type: 'master', category: '',
  });
  const [fieldForm, setFieldForm] = useState({
    code: '', label: '', data_type: 'text', required: false,
    data_type_params: {}, unique_field: false, readonly: false, 
    hidden: false, display_order: 0
  });

  useEffect(() => {
    loadEntities();
  }, []);

  const handleCreateEntity = async () => {
    try {
      const res = await apiPost('/api/entities', entityForm);
      if (!res.success) throw new Error(res.error);
      toast.success('Entidade criada!');
      setShowEntityForm(false);
      resetForm();
      loadEntities();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateEntity = async () => {
    try {
      const res = await apiPut(`/api/entities/${editingEntity.id}`, entityForm);
      if (!res.success) throw new Error(res.error);
      toast.success('Entidade atualizada!');
      setEditingEntity(null);
      loadEntities();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteEntity = async (id) => {
    if (!confirm('Deletar entidade? Todos os dados serão perdidos!')) return;
    try {
      const res = await apiDelete(`/api/entities/${id}`);
      if (res.success) {
        toast.success('Entidade deletada');
        loadEntities();
      }
    } catch (err) {
      toast.error('Erro ao deletar');
    }
  };

  const handleCreateField = async () => {
    try {
      if (!editingEntity) return;

      const res = await apiPost(`/api/entities/${editingEntity.id}/fields`, fieldForm);
      if (!res.success) throw new Error(res.error);
      toast.success('Campo criado!');
      setShowFieldForm(false);
      loadEntities();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      Package, Users, Settings, Factory, ShoppingCart, Clipboard, Truck,
      CreditCard, FileText, Scroll, Layers, Box
    };
    const Icon = icons[iconName] || Package;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Metadata Studio</h1>
          <p className="text-muted-foreground">
            Construtor visual de entidades, campos e fluxos
          </p>
        </div>
        <Button onClick={() => setShowEntityForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entidade
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entities">Entidades</TabsTrigger>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
        </TabsList>

        {/* === TAB ENTIDADES === */}
        <TabsContent value="entities" className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Campos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-muted rounded">
                          {getIcon(entity.icon)}
                        </div>
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {entity.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{entity.code}</code></TableCell>
                    <TableCell>
                      <Badge variant={entity.type === 'master' ? 'default' : 'secondary'}>
                        {entity.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{entity.fields?.length || 0} campos</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedEntity(entity);
                            setActiveTab('fields');
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingEntity(entity);
                            setEntityForm({
                              code: entity.code,
                              name: entity.name,
                              description: entity.description,
                              icon: entity.icon,
                              type: entity.type,
                              category: entity.category
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!entity.is_system && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleDeleteEntity(entity.id)}
                          >
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
        </TabsContent>

        {/* === TAB CAMPOS === */}
        <TabsContent value="fields" className="space-y-4">
          {!selectedEntity ? (
            <div className="text-center py-12 text-muted-foreground">
              Selecione uma entidade primeiro
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedEntity.name} — Campos</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure os campos desta entidade
                  </p>
                </div>
                <Button onClick={() => {
                  setEditingField(null);
                  setFieldForm({ code: '', label: '', data_type: 'text', required: false, data_type_params: {}, unique_field: false, readonly: false, hidden: false, display_order: 0 });
                  setShowFieldForm(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Campo
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Obrigatório</TableHead>
                      <TableHead>Único</TableHead>
                      <TableHead>Somente Leitura</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedEntity.fields || [])
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <code className="text-xs">{field.code}</code>
                          <div className="text-sm font-medium">{field.label}</div>
                        </TableCell>
                        <TableCell>
                          {fieldTypeOptions.find(t => t.id === field.data_type)?.label || field.data_type}
                        </TableCell>
                        <TableCell>
                          {field.required ? '✅' : '—'}
                        </TableCell>
                        <TableCell>
                          {field.unique_field ? '✅' : '—'}
                        </TableCell>
                        <TableCell>
                          {field.readonly ? '✅' : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingField(field);
                              setFieldForm({
                                code: field.code,
                                label: field.label,
                                data_type: field.data_type,
                                required: field.required,
                                data_type_params: field.data_type_params || {},
                                unique_field: field.unique_field || false,
                                readonly: field.readonly || false,
                                hidden: field.hidden || false,
                                display_order: field.display_order
                              });
                              setShowFieldForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="workflows">
          <p className="text-center py-12 text-muted-foreground">
            Em breve — Workflow Builder
          </p>
        </TabsContent>

        <TabsContent value="rules">
          <p className="text-center py-12 text-muted-foreground">
            Em breve — Rule Builder
          </p>
        </TabsContent>
      </Tabs>

      {/* === MODAL ENTIDADE === */}
      <Dialog open={showEntityForm} onOpenChange={setShowEntityForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntity ? 'Editar' : 'Nova'} Entidade</DialogTitle>
            <DialogDescription>
              {editingEntity ? 'Altere' : 'Crie'} uma nova entidade no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código (único, sem espaços)</Label>
              <Input 
                value={entityForm.code}
                onChange={(e) => setEntityForm({ ...entityForm, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder="ex: produto"
                disabled={!!editingEntity}
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input 
                value={entityForm.name}
                onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
                placeholder="Ex: Produto"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea 
                value={entityForm.description}
                onChange={(e) => setEntityForm({ ...entityForm, description: e.target.value })}
                placeholder="Descrição da entidade"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <select 
                  value={entityForm.type}
                  onChange={(e) => setEntityForm({ ...entityForm, type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="master">Master (cadastro)</option>
                  <option value="transaction">Transação (movimento)</option>
                  <option value="config">Configuração</option>
                </select>
              </div>
              <div>
                <Label>Ícone</Label>
                <Input 
                  value={entityForm.icon}
                  onChange={(e) => setEntityForm({ ...entityForm, icon: e.target.value })}
                  placeholder="Package"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntityForm(false)}>Cancelar</Button>
            <Button onClick={editingEntity ? handleUpdateEntity : handleCreateEntity}>
              {editingEntity ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === MODAL CAMPO === */}
      <Dialog open={showFieldForm} onOpenChange={setShowFieldForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Editar' : 'Novo'} Campo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código (sem espaços)</Label>
              <Input 
                value={fieldForm.code}
                onChange={(e) => setFieldForm({ ...fieldForm, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder="ex: preco_custo"
                disabled={!!editingField}
              />
            </div>
            <div>
              <Label>Label</Label>
              <Input 
                value={fieldForm.label}
                onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                placeholder="Ex: Preço de Custo"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <select
                value={fieldForm.data_type}
                onChange={(e) => setFieldForm({ ...fieldForm, data_type: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                {fieldTypeOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {fieldForm.data_type === 'select' && (
              <div>
                <Label>Opções (uma por linha)</Label>
                <Textarea
                  value={Object.values(fieldForm.data_type_params.options || {}).join('\n')}
                  onChange={(e) => {
                    const opts = e.target.value.split('\n').filter(o => o.trim());
                    setFieldForm({ 
                      ...fieldForm, 
                      data_type_params: { ...fieldForm.data_type_params, options: opts }
                    });
                  }}
                  placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                />
              </div>
            )}

            {fieldForm.data_type === 'reference' && (
              <div>
                <Label>Entidade Referenciada</Label>
                <select
                  value={fieldForm.data_type_params?.reference || ''}
                  onChange={(e) => setFieldForm({ 
                    ...fieldForm, 
                    data_type_params: { ...fieldForm.data_type_params, reference: e.target.value }
                  })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecione</option>
                  {entities.filter(e => e.code !== selectedEntity?.code).map(e => (
                    <option key={e.id} value={e.code}>{e.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={fieldForm.required}
                  onCheckedChange={(c) => setFieldForm({ ...fieldForm, required: c })}
                />
                <Label>Obrigatório</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={fieldForm.unique_field}
                  onCheckedChange={(c) => setFieldForm({ ...fieldForm, unique_field: c })}
                />
                <Label>Único</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={fieldForm.readonly}
                  onCheckedChange={(c) => setFieldForm({ ...fieldForm, readonly: c })}
                />
                <Label>Readonly</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={fieldForm.hidden}
                  onCheckedChange={(c) => setFieldForm({ ...fieldForm, hidden: c })}
                />
                <Label>Oculto</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldForm(false)}>Cancelar</Button>
            <Button onClick={handleCreateField}>
              {editingField ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Badge component inline
function Badge({ className = '', variant = 'default', children }) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
