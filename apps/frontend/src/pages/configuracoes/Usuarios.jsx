import { useEffect, useState } from 'react';

import PageHeader from '@/components/common/PageHeader';

import DataTable from '@/components/common/DataTable';

import FormModal, { inp, lbl, req } from '@/components/common/FormModal';

import { UserPlus, Edit2, Eye, Trash2, Shield } from 'lucide-react';

import { toast } from 'sonner';

import {

  PERFIS_LABELS,

  PERFIS_SELECT_KEYS,

  normalizePerfilSelectValue,

} from '@/lib/perfis';

import { usePermissao } from '@/lib/PermissaoContext';

import { api } from '@/services/api';

import { devWarn } from '@/lib/devLog';

import { primaryRole } from '@/lib/rolePriority';

import { roleCodeToPerfilUxKey } from '@/lib/roleToPerfil';



const PERFIL_TO_ROLE = {

  dono: 'master',

  gerente_geral: 'gerente',

  gerente_vendas: 'orcamentista_vendas',

  gerente_producao: 'gerente_producao',

  vendas: 'orcamentista_vendas',

  orcamentista_vendas: 'orcamentista_vendas',

  projetista: 'projetista',

  corte_laser: 'corte_laser',

  dobra_montagem: 'dobra_montagem',

  solda: 'solda',

  expedicao: 'expedicao',

  compras: 'gerente',

  financeiro: 'financeiro',

  pcp: 'gerente_producao',

  engenharia: 'projetista',

  producao: 'corte_laser',

  qualidade: 'qualidade',

  rh: 'rh',

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



function buildUsuarioForm(usuario) {

  if (!usuario) {

    return {

      nome: '',

      email: '',

      password: '',

      perfil: 'visualizador',

      ativo: true,

    };

  }

  return {

    nome: usuario.nome ?? '',

    email: usuario.email ?? '',

    password: '',

    perfil: normalizePerfilSelectValue(usuario.perfil),

    ativo: Boolean(usuario.ativo),

  };

}



export default function Usuarios() {

  const { pode, iniciarImpersonate, usuarioAtual } = usePermissao();

  const [dados, setDados] = useState([]);

  const [editando, setEditando] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [showPerms, setShowPerms] = useState(null);

  const [saving, setSaving] = useState(false);



  const mapBackendUserToGrid = (u) => {

    const nome = u.full_name || u.email || 'Usuário';

    const rolesApi = Array.isArray(u.roles) ? u.roles : [];
    const perfil = roleCodeToPerfilUxKey(primaryRole(rolesApi));
    const avatar = getAvatarFromName(nome);



    return {

      id: u.id,

      nome,

      email: u.email,

      perfil,

      roles: rolesApi,

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

      devWarn('[Usuarios] Falha ao carregar da API:', err?.message);

      setDados([]);

      toast.error('Não foi possível carregar usuários.');

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

        toast.success('Usuário atualizado.');

      } else {

        if (!form.password || form.password.length < 8) {

          toast.error('Senha obrigatória com no mínimo 8 caracteres para novo usuário.');

          return;

        }



        await api.post('/api/users', {

          email: form.email,

          password: form.password,

          full_name: form.nome,

          roles: [PERFIL_TO_ROLE[form.perfil] || 'user'],

        });

        toast.success('Usuário criado.');

      }



      setEditando(null);

      setShowModal(false);

      await reload();

    } catch (err) {

      toast.error(err?.response?.data?.error || err?.message || 'Falha ao salvar usuário.');

    } finally {

      setSaving(false);

    }

  };



  const handleDelete = async (id) => {

    if (!confirm('Remover usuário?')) return;



    try {

      await api.delete(`/api/users/${id}`);

      toast.success('Usuário removido.');

      await reload();

    } catch (err) {

      toast.error(err?.response?.data?.error || err?.message || 'Falha ao remover usuário.');

    }

  };



  const columns = [

    { key: 'avatar', label: '', width: 40, sortable: false, render: (v, row) => (

      <div className="w-7 h-7 cozinha-blue-bg rounded-full flex items-center justify-center text-white text-[10px] font-bold">{v || row.nome?.slice(0,2).toUpperCase()}</div>

    )},

    { key: 'nome', label: 'Nome' },

    { key: 'email', label: 'E-mail', width: 200 },

    { key: 'perfil', label: 'Perfil', width: 200, render: (v, row) => (

      <div className="flex flex-wrap items-center gap-1">

        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">

          {getPerfilLabel(v)}

        </span>

        {row.roles?.length > 1 ? (

          <span className="text-[10px] text-muted-foreground">+{row.roles.length - 1} papel(is)</span>

        ) : null}

      </div>

    ) },

    { key: 'ativo', label: 'Status', width: 80, render: v => (

      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v ? 'Ativo' : 'Inativo'}</span>

    ), sortable: false },

    { key: 'id', label: 'Ações', width: 130, sortable: false, render: (v, row) => (

      <div className="flex items-center gap-1">

        {pode('gerenciar_usuarios') && (

          <button type="button" onClick={e => { e.stopPropagation(); setShowPerms(row); }} title="Permissões e papéis" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary">

            <Shield size={13} />

          </button>

        )}

        {pode('editar_config') && (

          <button type="button" onClick={e => { e.stopPropagation(); setEditando(row); setShowModal(true); }} title="Editar" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary">

            <Edit2 size={13} />

          </button>

        )}

        {pode('impersonate') && row.id !== usuarioAtual?.id && (

          <button type="button" onClick={e => { e.stopPropagation(); iniciarImpersonate(row.id); }} title="Ver como" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-orange-500">

            <Eye size={13} />

          </button>

        )}

        {pode('gerenciar_usuarios') && row.id !== usuarioAtual?.id && (

          <button type="button" onClick={e => { e.stopPropagation(); handleDelete(row.id); }} title="Remover" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive">

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

          <button type="button" onClick={() => { setEditando(null); setShowModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs cozinha-blue-bg text-white rounded hover:opacity-90">

            <UserPlus size={13} /> Novo Usuário

          </button>

        )}

      />



      <div className="bg-white border border-border rounded-lg overflow-hidden">

        <DataTable columns={columns} data={dados} />

      </div>



      {showModal && (

        <UsuarioModal

          key={editando?.id ?? 'novo'}

          usuario={editando}

          onClose={() => { setShowModal(false); setEditando(null); }}

          onSave={handleSave}

          saving={saving}

        />

      )}



      {showPerms && (

        <PermissoesModal usuario={showPerms} onClose={() => { setShowPerms(null); reload(); }} />

      )}

    </div>

  );

}



function UsuarioModal({ usuario, onClose, onSave, saving }) {

  const [form, setForm] = useState(() => buildUsuarioForm(usuario));

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const perfilSelecionado = normalizePerfilSelectValue(form.perfil);



  return (

    <FormModal title={usuario ? `Editar — ${usuario.nome}` : 'Novo Usuário'} onClose={onClose} onSave={() => onSave({ ...form, perfil: perfilSelecionado })} saving={saving} size="md">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="sm:col-span-2"><label className={lbl}>Nome {req}</label><input className={inp} autoComplete="off" value={form.nome} onChange={e => upd('nome', e.target.value)} /></div>

        <div className="sm:col-span-2"><label className={lbl}>E-mail {req}</label><input type="email" className={inp} autoComplete="off" value={form.email} onChange={e => upd('email', e.target.value)} /></div>

        {!usuario && (

          <div className="sm:col-span-2"><label className={lbl}>Senha {req}</label><input type="password" className={inp} autoComplete="new-password" value={form.password || ''} onChange={e => upd('password', e.target.value)} /></div>

        )}

        <div className="sm:col-span-2"><label className={lbl}>Perfil principal</label>

          <select

            id="cfg-usuario-perfil"

            className={inp}

            value={perfilSelecionado}

            autoComplete="off"

            onChange={(e) => upd('perfil', normalizePerfilSelectValue(e.target.value))}

          >

            {PERFIS_SELECT_KEYS.map((k) => (

              <option key={k} value={k}>{PERFIS_LABELS[k]}</option>

            ))}

          </select>

        </div>

        <div className="flex items-center gap-2 sm:col-span-2">

          <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => upd('ativo', e.target.checked)} />

          <label htmlFor="ativo" className="text-xs">Usuário ativo</label>

        </div>

      </div>

    </FormModal>

  );

}



function PermissoesModal({ usuario, onClose }) {

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [catalog, setCatalog] = useState(null);

  const [effective, setEffective] = useState(null);

  const [rolesCatalog, setRolesCatalog] = useState([]);

  const [selectedRoles, setSelectedRoles] = useState(() => [...(usuario.roles || [])]);



  useEffect(() => {

    let ok = true;

    (async () => {

      setLoading(true);

      try {

        const [cat, eff, rl] = await Promise.all([

          api.get('/api/permissions/catalog'),

          api.get(`/api/permissions/users/${usuario.id}/effective`),

          api.get('/api/roles'),

        ]);

        if (!ok) return;

        setCatalog(cat?.data?.data || null);

        setEffective(eff?.data?.data || null);

        setRolesCatalog(Array.isArray(rl?.data?.data) ? rl.data.data : []);

      } catch {

        if (ok) toast.error('Não foi possível carregar permissões.');

      } finally {

        if (ok) setLoading(false);

      }

    })();

    return () => { ok = false; };

  }, [usuario.id]);



  const toggleRole = (code) => {

    setSelectedRoles((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  };



  const handleSave = async () => {

    if (!selectedRoles.length) {

      toast.error('Selecione ao menos um papel.');

      return;

    }

    setSaving(true);

    try {

      await api.put(`/api/users/${usuario.id}/roles`, {

        roles: selectedRoles,

      });

      toast.success('Papéis do usuário atualizados.');

      onClose();

    } catch (e) {

      toast.error(e?.response?.data?.error || e?.message || 'Falha ao salvar.');

    } finally {

      setSaving(false);

    }

  };



  const permSet = new Set(effective?.permissions || []);

  const byCat = catalog?.byCategory || {};



  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">

      <div className="flex max-h-[85vh] w-[95vw] sm:max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-border px-5 py-3">

          <div>

            <h2 className="flex items-center gap-2 text-sm font-semibold">

              <Shield size={14} className="text-primary" /> Papéis e permissões — {usuario.nome}

            </h2>

            <p className="text-[11px] text-muted-foreground">

              As permissões efetivas vêm dos papéis abaixo (catálogo no banco). Ajuste os papéis e salve.

            </p>

          </div>

        </div>



        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-3">

          {loading && <p className="text-xs text-muted-foreground">Carregando…</p>}



          {!loading && (

            <>

              <div>

                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Papéis (roles)</div>

                <div className="grid max-h-40 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">

                  {rolesCatalog.map((r) => (

                    <label key={r.code} className="flex cursor-pointer items-center gap-2 rounded border border-border p-2 text-xs hover:bg-muted">

                      <input

                        type="checkbox"

                        className="accent-primary"

                        checked={selectedRoles.includes(r.code)}

                        onChange={() => toggleRole(r.code)}

                      />

                      <span>

                        <span className="font-medium">{r.name}</span>

                        <span className="ml-1 font-mono text-[10px] text-muted-foreground">{r.code}</span>

                      </span>

                    </label>

                  ))}

                </div>

              </div>



              <div>

                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Permissões efetivas (somente leitura)</div>

                <div className="space-y-3">

                  {Object.entries(byCat).map(([cat, rows]) => (

                    <div key={cat}>

                      <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">{cat}</div>

                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">

                        {(rows || []).map((p) => (

                          <div

                            key={p.code}

                            className={`flex items-center gap-2 rounded border px-2 py-1.5 text-[11px] ${

                              permSet.has(p.code) ? 'border-green-200 bg-green-50' : 'border-border bg-muted/40 text-muted-foreground'

                            }`}

                          >

                            <input type="checkbox" checked={permSet.has(p.code)} readOnly className="accent-primary" />

                            <span>{p.name}</span>

                          </div>

                        ))}

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            </>

          )}

        </div>



        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">

          <button type="button" onClick={onClose} className="rounded px-4 py-1.5 text-xs border border-border hover:bg-muted">

            Fechar

          </button>

          <button

            type="button"

            disabled={saving || loading}

            onClick={handleSave}

            className="rounded px-4 py-1.5 text-xs cozinha-blue-bg text-white hover:opacity-90 disabled:opacity-50"

          >

            {saving ? 'Salvando…' : 'Salvar papéis'}

          </button>

        </div>

      </div>

    </div>

  );

}


