import { apiGet } from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { useMetadataStore } from '@/stores/metadataStore';
import { useAuth } from '@/lib/AuthContext';
import DynamicFormModal from './DynamicFormModal';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, MoreHorizontal, Eye, Edit, Trash2 
} from 'lucide-react';
import { useDataStore } from '@/stores/dataStore';
import { toast } from 'sonner';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo } from 'react';
import { usePermissionEngine } from '@/lib/PermissaoContext';

export default function DynamicEntityPage({ entityCode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getEntity, loadEntities, loading } = useMetadataStore();
  const { getRecords, setRecords, setFilter, clearEntityCache } = useDataStore();
  const permissionEngine = usePermissionEngine();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [recordsList, setRecordsList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 25;

  const entity = getEntity(entityCode);

  // Carrega entidade se não estiver
  useEffect(() => {
    if (!entity) {
      loadEntities();
    }
  }, [entityCode]);

  // Carrega registros
  useEffect(() => {
    if (entity) {
      loadRecords();
    }
  }, [entity, filters, search, page]);

  const canCreate = true; // perm futura
  const canUpdate = true;
  const canDelete = true;

  const loadRecords = async () => {
    if (!entity) return;
    
    setLoadingData(true);
    try {
      const json = await apiGet('/api/records', {
        entity: entityCode,
        page: page.toString(),
        limit: limit.toString(),
        search,
        ...filters
      });

      if (json.success) {
        // Backend retorna { id, data, created_at... }. A UI espera campos no nível raiz.
        const rows = Array.isArray(json.data) ? json.data : [];
        setRecordsList(rows.map((r) => ({ id: r.id, ...(r.data || {}) })));
      }
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = (savedRecord) => {
    clearEntityCache(entityCode);
    loadRecords();
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza?')) return;

    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      const json = await res.json();
      
      if (json.success) {
        toast.success('Excluído com sucesso');
        loadRecords();
      }
    } catch (err) {
      toast.error('Erro ao excluir');
    }
  };

  // Gera colunas da tabela dinamicamente
  const columns = useMemo(() => {
    if (!entity?.fields) return [];
    
    return entity.fields
      .filter(f => !f.hidden && f.code !== 'id' && f.code !== 'created_by' && f.code !== 'updated_at')
      .map(field => ({
        key: field.code,
        label: field.label,
        width: field.width || 'auto',
        sortable: !field.data_type?.includes('text'), // simplificado
        render: (value, record) => {
          // Render custom para tipos específicos
          if (field.data_type === 'boolean') {
            return value ? 'Sim' : 'Não';
          }
          
          if (field.data_type === 'reference') {
            // Mostra label (tenta encontrar na lista de referências)
            return value || '—';
          }

          if (field.data_type === 'currency' || field.data_type === 'number') {
            return value != null ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
          }

          if (field.code === 'status') {
            const statusColors = {
              'Ativo': 'bg-green-100 text-green-800',
              'Inativo': 'bg-gray-100 text-gray-800',
              'Aberto': 'bg-blue-100 text-blue-800',
              'Aguardando Aprovação': 'bg-yellow-100 text-yellow-800',
              'Aprovado': 'bg-green-100 text-green-800',
              'Cancelado': 'bg-red-100 text-red-800',
              'concluida': 'bg-green-600 text-white',
              'em_andamento': 'bg-blue-600 text-white',
            };
            const cls = statusColors[value] || 'bg-gray-100 text-gray-800';
            return <Badge className={cls}>{value}</Badge>;
          }

          return value || '—';
        }
      }));
  }, [entity]);

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{entity.name}</h1>
          <p className="text-sm text-muted-foreground">{entity.description}</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo {entity.name}
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${entity.name.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtros dinâmicos */}
        {entity.fields
          ?.filter(f => f.data_type === 'select' || f.data_type === 'boolean')
          .map(field => (
            <div key={field.id} className="flex items-center gap-2">
              <select
                value={filters[field.code] || ''}
                onChange={(e) => setFilter(entityCode, { ...filters, [field.code]: e.target.value || null })}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">{field.label}</option>
                {field.data_type_params?.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key} style={{ width: col.width }}>
                  {col.label}
                </TableHead>
              ))}
              {(canUpdate || canDelete) && <TableHead>Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingData ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : recordsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              recordsList.map((record, idx) => (
                <TableRow 
                  key={record.id} 
                  className={idx % 2 === 0 ? 'bg-muted/20' : ''}
                >
                  {columns.map(col => (
                    <TableCell 
                      key={`${record.id}-${col.key}`}
                      onClick={() => permissionEngine?.can('read', entityCode) && setDetail(record)}
                      className={permissionEngine?.can('read', entityCode) ? 'cursor-pointer hover:bg-muted/50' : ''}
                    >
                      {col.render(record[col.key], record)}
                    </TableCell>
                  ))}
                  {(canUpdate || canDelete) && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(canUpdate || permissionEngine?.canByOwnership('update', entityCode, { record })) && (
                            <DropdownMenuItem onClick={() => setEditing(record)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {entityCode === 'ordem_producao' && (
                            <DropdownMenuItem onClick={() => navigate(`/producao/ordens/${record.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(record.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação simples */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{recordsList.length} registros</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span>Página {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={recordsList.length < limit}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Modal Formulário */}
      <DynamicFormModal
        entityCode={entityCode}
        entity={entity}
        record={editing}
        open={showForm || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditing(null);
          }
        }}
        onSuccess={handleSave}
      />

      {/* Modal Detalhe (apenas leitura) */}
      {detail && (
        <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
          <DialogContent className="lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes — {entity.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {entity.fields
                ?.filter(f => !f.hidden)
                .map(field => (
                  <div key={field.id} className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{field.label}:</span>
                    <span className="font-medium">
                      {field.data_type === 'reference' 
                        ? detail[field.code] 
                        : field.data_type === 'boolean'
                        ? (detail[field.code] ? 'Sim' : 'Não')
                        : detail[field.code]?.toLocaleString() || '—'
                      }
                    </span>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
