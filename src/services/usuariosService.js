import { storage } from './storage';

const COLLECTION_NAME = 'usuarios';

// Dados mock para modo local
const MOCK_USUARIOS = [
  {
    uid: '1',
    email: 'admin@nomus.com.br',
    displayName: 'Admin Nomus',
    role: 'dono',
    permissoesCustom: [],
    ativo: true,
    avatar: 'AN',
  },
  {
    uid: '2',
    email: 'carlos@nomus.com.br',
    displayName: 'Carlos Silva',
    role: 'vendas',
    permissoesCustom: ['aprovar_pedidos'],
    ativo: true,
    avatar: 'CS',
  },
  {
    uid: '3',
    email: 'ana@nomus.com.br',
    displayName: 'Ana Paula',
    role: 'financeiro',
    permissoesCustom: [],
    ativo: true,
    avatar: 'AP',
  },
];

// Inicializar dados mock
if (!localStorage.getItem('nomus_erp_usuarios')) {
  storage.set('usuarios', MOCK_USUARIOS);
}

export const usuariosService = {
  // Listar todos os usuários
  async getAll() {
    return storage.get('usuarios', MOCK_USUARIOS);
  },

  // Obter usuário por UID
  async getByUID(uid) {
    const usuarios = storage.get('usuarios', MOCK_USUARIOS);
    return usuarios.find(u => u.uid === uid) || null;
  },

  // Obter usuário por email
  async getByEmail(email) {
    const usuarios = await this.getAll();
    return usuarios.find(u => u.email === email) || null;
  },

  // Criar novo usuário
  async create(usuario) {
    const usuarios = storage.get('usuarios', MOCK_USUARIOS);
    const novo = {
      ...usuario,
      uid: usuario.uid || Date.now().toString(),
      ativo: true,
    };
    storage.set('usuarios', [...usuarios, novo]);
    return novo;
  },

  // Atualizar usuário
  async update(uid, data) {
    const usuarios = storage.get('usuarios', MOCK_USUARIOS);
    const updated = usuarios.map(u =>
      u.uid === uid ? { ...u, ...data } : u
    );
    storage.set('usuarios', updated);
    return { uid, ...data };
  },

  // Deletar usuário
  async delete(uid) {
    const usuarios = storage.get('usuarios', MOCK_USUARIOS);
    storage.set('usuarios', usuarios.filter(u => u.uid !== uid));
  },

  // Listar usuários por role
  async getByRole(role) {
    const usuarios = await this.getAll();
    return usuarios.filter(u => u.role === role);
  },

  // Desativar usuário
  async deactivate(uid) {
    return this.update(uid, { ativo: false });
  },

  // Ativar usuário
  async activate(uid) {
    return this.update(uid, { ativo: true });
  },

  // Verificar se tem permissão
  async hasPermission(uid, permission) {
    const user = await this.getByUID(uid);
    if (!user) return false;
    
    // Dono tem todas as permissões
    if (user.role === 'dono') return true;
    
    return user.permissoesCustom.includes(permission);
  },

  // Obter roles únicos
  async getRoles() {
    const usuarios = await this.getAll();
    const roles = new Set(usuarios.map(u => u.role));
    return Array.from(roles);
  },

  // Contar usuários
  async count() {
    const usuarios = await this.getAll();
    return usuarios.length;
  },

  // Listener reservado para futuras atualizacoes em tempo real via API
  onUsuariosChange(callback) {
    return () => {};
  },

  // Buscar usuários
  async search(termo) {
    const usuarios = await this.getAll();
    const termo_lower = termo.toLowerCase();
    return usuarios.filter(u =>
      u.displayName.toLowerCase().includes(termo_lower) ||
      u.email.toLowerCase().includes(termo_lower)
    );
  },

  // Adicionar permissão customizada
  async addPermission(uid, permission) {
    const user = await this.getByUID(uid);
    if (!user) throw new Error('Usuário não encontrado');
    
    const perms = new Set(user.permissoesCustom || []);
    perms.add(permission);
    
    return this.update(uid, { permissoesCustom: Array.from(perms) });
  },

  // Remover permissão customizada
  async removePermission(uid, permission) {
    const user = await this.getByUID(uid);
    if (!user) throw new Error('Usuário não encontrado');
    
    const perms = new Set(user.permissoesCustom || []);
    perms.delete(permission);
    
    return this.update(uid, { permissoesCustom: Array.from(perms) });
  },
};
