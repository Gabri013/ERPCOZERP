const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Serviço de usuários do sistema
// Futuramente substituir por chamadas à API real

import { storage } from './storage';

const MOCK_USUARIOS = [
  { id: '1', nome: 'Admin Nomus', email: 'admin@nomus.com.br', perfil: 'dono', permissoesCustom: [], ativo: true, avatar: 'AN' },
  { id: '2', nome: 'Carlos Silva', email: 'carlos@nomus.com.br', perfil: 'vendas', permissoesCustom: ['aprovar_pedidos'], ativo: true, avatar: 'CS' },
  { id: '3', nome: 'Ana Paula', email: 'ana@nomus.com.br', perfil: 'financeiro', permissoesCustom: [], ativo: true, avatar: 'AP' },
  { id: '4', nome: 'Rafael Costa', email: 'rafael@nomus.com.br', perfil: 'vendas', permissoesCustom: [], ativo: true, avatar: 'RC' },
  { id: '5', nome: 'Maria Lima', email: 'maria@nomus.com.br', perfil: 'qualidade', permissoesCustom: [], ativo: false, avatar: 'ML' },
  { id: '6', nome: 'João Melo', email: 'joao@nomus.com.br', perfil: 'producao', permissoesCustom: [], ativo: true, avatar: 'JM' },
  { id: '7', nome: 'Pedro Alves', email: 'pedro@nomus.com.br', perfil: 'pcp', permissoesCustom: [], ativo: true, avatar: 'PA' },
];

if (!localStorage.getItem('nomus_erp_usuarios_sistema')) {
  storage.set('usuarios_sistema', MOCK_USUARIOS);
}

export const userService = {
  getAll: () => storage.get('usuarios_sistema', MOCK_USUARIOS),

  getById: (id) => userService.getAll().find(u => u.id === id),

  // Simula o usuário atual logado — em produção, vem do db.auth.me()
  getCurrentUser: () => {
    const logado = storage.get('usuario_logado_id', '1');
    return userService.getById(logado) || MOCK_USUARIOS[0];
  },

  setCurrentUser: (id) => {
    storage.set('usuario_logado_id', id);
  },

  save: (usuario) => {
    const todos = userService.getAll();
    if (todos.find(u => u.id === usuario.id)) {
      storage.set('usuarios_sistema', todos.map(u => u.id === usuario.id ? usuario : u));
    } else {
      const novo = { ...usuario, id: Date.now().toString(), avatar: usuario.nome.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() };
      storage.set('usuarios_sistema', [...todos, novo]);
    }
  },

  delete: (id) => {
    storage.set('usuarios_sistema', userService.getAll().filter(u => u.id !== id));
  },
};