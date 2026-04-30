import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal, { inp, lbl, req } from '@/components/common/FormModal';
import { UserPlus, Edit2, Eye, Trash2, Shield } from 'lucide-react';
import { userService } from '@/services/userService';
import { PERFIS_LABELS, TODAS_PERMISSOES, getPermissoesPorPerfil } from '@/lib/perfis';
import { usePermissao } from '@/lib/PermissaoContext';

const statusCor = { true: 'bg-green-100 text-green-700', false: 'bg-gray-100 text-gray-600' };

export default function Usuarios() {
  const { pode, iniciarImpersonate, usuarioAtual } = usePermissao();
  const [dados, setDados] = useState(userService.getAll());
  const [editando, setEditando] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPerms, setShowPerms] = useState(null); // usuário cujas perms custom estão sendo editadas
  const [saving, setSaving] = useState(false);

  const reload = () => setDados(userService.getAll());

  const handleSave = async (form) => {
    setSaving(true);
    userService.save(form);
    setSaving(false);
    setEditando(null);
    setShowModal(false);
    reload();
  };

  const handleDelete = (id) => {
    if (!confirm('Remover usuário?')) return;
    userService.delete(id);
    reload();
  };

  const togglePermCustom = (usuario, perm) => {
    const custom = usuario.permissoesCustom || [];
    const nova = custom.includes(perm) ? custom.filter(p => p !== perm) : [...custom, perm];
    const atualizado = { ...usuario, permissoesCustom: nova };
    userService.save(atualizado);
    setShowPerms(atualizado);
    reload();
  };

  const columns = [
    { key: 'avatar', label: '', width: 40, sortable: false, render: (v, row) => (
      <div className="w-7 h-7 nomus-blue-bg rounded-full flex items-center justify-center text-white text-[10px] font-bold">{v || row.nome?.slice(0,2).toUpperCase()}</div>
    )},
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'E-mail', width: 200 },
    { key: 'perfil', label: 'Perfil', width: 150, render: v => PERFIS_LABELS[v] || v },
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
          <button onClick={() => { setEditando(null); setShowModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90">
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
  const [form, setForm] = useState(usuario || { nome: '', email: '', perfil: 'visualizador', ativo: true, permissoesCustom: [] });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <FormModal title={usuario ? `Editar — ${usuario.nome}` : 'Novo Usuário'} onClose={onClose} onSave={() => onSave(form)} saving={saving} size="md">
      <div className="space-y-3">
        <div><label className={lbl}>Nome {req}</label><input className={inp} value={form.nome} onChange={e => upd('nome', e.target.value)} /></div>
        <div><label className={lbl}>E-mail {req}</label><input type="email" className={inp} value={form.email} onChange={e => upd('email', e.target.value)} /></div>
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
                        disabled={naBase} // não pode remover permissão da base do perfil aqui
                        onChange={() => !naBase && onToggle(usuario, perm.key)}
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
          <button onClick={onClose} className="px-4 py-1.5 text-xs nomus-blue-bg text-white rounded hover:opacity-90">Fechar</button>
        </div>
      </div>
    </div>
  );
}

function getPermissoesPorPerfilHelper(perfil) {
  return getPermissoesPorPerfil(perfil);
}