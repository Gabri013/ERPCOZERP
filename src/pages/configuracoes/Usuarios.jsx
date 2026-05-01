import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { UserPlus, Edit2, Eye, Trash2, Shield } from 'lucide-react';
import { PERFIS_LABELS, TODAS_PERMISSOES, getPermissoesPorPerfil } from '@/lib/perfis';
import { usePermissao } from '@/lib/PermissaoContext';
import { api } from '@/services/api';

const statusCor = { true: 'bg-green-100 text-green-700', false: 'bg-gray-100 text-gray-600' };
const ROLE_TO_PERFIL = {
  master: 'dono',
  gerente: 'gerente_geral',
  gerente_producao: 'gerente_producao',
  orcamentista_vendas: 'vendas',
  projetista: 'engenharia',
  corte_laser: 'producao',
  dobra_montagem: 'producao',
  solda: 'producao',
  expedicao: 'producao',
  qualidade: 'qualidade',
  user: 'visualizador',
};
const PERFIL_TO_ROLE = {
  dono: 'master',
  gerente_geral: 'gerente',
  gerente_vendas: 'orcamentista_vendas',
  gerente_producao: 'gerente_producao',
  vendas: 'orcamentista_vendas',
  compras: 'gerente',
  financeiro: 'gerente',
  pcp: 'gerente_producao',
  engenharia: 'projetista',
  producao: 'corte_laser',
  qualidade: 'qualidade',
  rh: 'gerente',
  visualizador: 'user',
};

function getAvatarFromName(name) {
  const initials = String(name || 'US')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.replace(/[^A-Za-zÀ-ÿ]/g, ''))
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || 'US';
}

function getPerfilLabel(perfil) {
  return PERFIS_LABELS[perfil] || perfil || 'Usuário';
}

export default function Usuarios() {
  const { pode, iniciarImpersonate, usuarioAtual } = usePermissao();
  const [dados, setDados] = useState([]);
  const [editando, setEditando] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPerms, setShowPerms] = useState(null); // usuário cujas perms custom estão sendo editadas
  const [saving, setSaving] = useState(false);

  const mapBackendUserToGrid = (u) => {
    const nome = u.full_name || u.email || 'Usuário';
    const perfil = ROLE_TO_PERFIL[u.roles?.[0]] || u.roles?.[0] || 'user';
    const avatar = getAvatarFromName(nome);

    return {
      id: u.id,
      nome,
      email: u.email,
      perfil,
      permissoesCustom: [],
      ativo: Boolean(u.active),
      avatar,
    };
  };

  const reload = async () => {
    try {
      const response = await api.get('/api/users?limit=200');
      const body = response?.data;
      const rows = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
      setDados(rows.map(mapBackendUserToGrid));
    } catch (err) {
      console.warn('[Usuarios] Falha ao carregar da API:', err.message);
      setDados([]);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editando?.id) {
        await api.put(`/api/users/${editando.id}`, {
          full_name: form.nome,
          active: Boolean(form.ativo),
          roles: [PERFIL_TO_ROLE[form.perfil] || 'user'],
        });
      } else {
        if (!form.password || form.password.length < 8) {
          alert('Senha obrigatória com no mínimo 8 caracteres para novo usuário.');
          return;
        }

        await api.post('/api/users', {
          email: form.email,
          password: form.password,
          full_name: form.nome,
          roles: [PERFIL_TO_ROLE[form.perfil] || 'user'],
        });
      }

      setEditando(null);
      setShowModal(false);
      await reload();
    } catch (err) {
      alert(err?.message || 'Falha ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover usuário?')) return;

    try {
      await api.delete(`/api/users/${id}`);
      await reload();
    } catch (err) {
      alert(err?.message || 'Falha ao remover usuário.');
    }
  };

  const togglePermCustom = (usuario, perm) => {
    // Em modo API, este modal é apenas visualização até expor endpoint de permissões custom.
    return;
  };

  const columns = [
    { key: 'avatar', label: '', width: 40, sortable: false, render: (v, row) => (
      <div className="w-7 h-7 cozinha-blue-bg rounded-full flex items-center justify-center text-white text-[10px] font-bold">{v || row.nome?.slice(0,2).toUpperCase()}</div>
    )},
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'E-mail', width: 200 },
    { key: 'perfil', label: 'Perfil', width: 150, render: v => getPerfilLabel(v) },
    { key: 'ativo', label: 'Status', width: 80, render: v => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusCor[v]}`}>{v ? 'Ativo' : 'Inativo'}</span>
    ), sortable: false },
    { key: 'id', label: 'Ações', width: 130, sortable: false, render: (v, row) => (
      <div className="flex items-center gap-1">
        {pode('editar_config') && (
          <button onClick={e => { e.stopPropagation(); setShowPerms(row); }} title="Permissões" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary">
            <Shield size={13} />
          </button>
        )}
        {pode('editar_config') && (
          <button onClick={e => { e.stopPropagation(); setEditando(row); setShowModal(true); }} title="Editar" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary">
            <Edit2 size={13} />
          </button>
        )}
        {pode('impersonate') && row.id !== usuarioAtual?.id && (
          <button onClick={e => { e.stopPropagation(); iniciarImpersonate(row.id); }} title="Ver como" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-orange-500">
            <Eye size={13} />
          </button>
        )}
        {pode('gerenciar_usuarios') && row.id !== usuarioAtual?.id && (
          <button onClick={e => { e.stopPropagation(); handleDelete(row.id); }} title="Remover" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Usuários do Sistema" breadcrumbs={['Início', 'Configurações', 'Usuários']}
        actions={pode('gerenciar_usuarios') && (
          <button onClick={() => { setEditando(null); setShowModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">
            <UserPlus size={13} /> Novo Usuário
          </button>
        )}
      />

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <DataTable columns={columns} data={dados} />
      </div>

      {/* Modal Criar/Editar */}
      {showModal && (
        <UsuarioModal usuario={editando} onClose={() => { setShowModal(false); setEditando(null); }} onSave={handleSave} saving={saving} />
      )}

      {/* Modal Permissões Custom */}
      {showPerms && (
        <PermissoesModal usuario={showPerms} onClose={() => { setShowPerms(null); reload(); }} onToggle={togglePermCustom} />
      )}
    </div>
  );
}

function UsuarioModal({ usuario, onClose, onSave, saving }) {
  const [form, setForm] = useState(usuario || { nome: '', email: '', password: '', perfil: 'visualizador', ativo: true, permissoesCustom: [] });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <FormModal title={usuario ? `Editar — ${usuario.nome}` : 'Novo Usuário'} onClose={onClose} onSave={() => onSave(form)} saving={saving} size="md">
      <div className="space-y-3">
        <div><label className={lbl}>Nome {req}</label><input className={inp} value={form.nome} onChange={e => upd('nome', e.target.value)} /></div>
        <div><label className={lbl}>E-mail {req}</label><input type="email" className={inp} value={form.email} onChange={e => upd('email', e.target.value)} /></div>
        {!usuario && (
          <div><label className={lbl}>Senha {req}</label><input type="password" className={inp} value={form.password || ''} onChange={e => upd('password', e.target.value)} /></div>
        )}
        <div><label className={lbl}>Perfil</label>
          <select className={inp} value={form.perfil} onChange={e => upd('perfil', e.target.value)}>
            {Object.entries(PERFIS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => upd('ativo', e.target.checked)} />
          <label htmlFor="ativo" className="text-xs">Usuário ativo</label>
        </div>
      </div>
    </FormModal>
  );
}

function PermissoesModal({ usuario, onClose, onToggle }) {
  const modulosUnicos = [...new Set(TODAS_PERMISSOES.map(p => p.modulo))];
  const perfsBase = getPermissoesPorPerfilHelper(usuario.perfil);
  const readOnly = appConfig.isApi;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2"><Shield size={14} className="text-primary" /> Permissões — {usuario.nome}</h2>
            <p className="text-[11px] text-muted-foreground">Perfil base: <strong>{PERFIS_LABELS[usuario.perfil]}</strong> · Permissões extras marcadas em azul</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {modulosUnicos.map(modulo => (
            <div key={modulo}>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{modulo}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {TODAS_PERMISSOES.filter(p => p.modulo === modulo).map(perm => {
                  const naBase = perfsBase.includes(perm.key);
                  const isCustom = usuario.permissoesCustom?.includes(perm.key);
                  const ativa = naBase || isCustom;
                  return (
                    <label key={perm.key} className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs transition-colors ${ativa ? (isCustom ? 'border-primary bg-blue-50' : 'border-green-200 bg-green-50') : 'border-border hover:bg-muted'}`}>
                      <input
                        type="checkbox"
                        checked={ativa}
                        disabled={naBase || readOnly} // não pode remover permissão da base do perfil aqui
                        onChange={() => !naBase && !readOnly && onToggle(usuario, perm.key)}
                        className="accent-primary"
                      />
                      <span className={ativa ? 'font-medium' : 'text-muted-foreground'}>{perm.label}</span>
                      {isCustom && <span className="text-[9px] text-primary font-bold ml-auto">+EXTRA</span>}
                      {naBase && <span className="text-[9px] text-green-600 font-bold ml-auto">PERFIL</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end px-5 py-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">Fechar</button>
        </div>
      </div>
    </div>
  );
}

function getPermissoesPorPerfilHelper(perfil) {
  return getPermissoesPorPerfil(perfil);
}