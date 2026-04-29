import { storage } from './storage';

const COLLECTION_NAME = 'produtos';

// Dados mock para modo local
const MOCK_PRODUTOS = [
  {
    id: '1',
    nome: 'Eixo Transmissão 25mm',
    descricao: 'Eixo para transmissão com acabamento polido',
    sku: 'EIX-025',
    categoria: 'Eixos',
    preco: 250.00,
    custoproduto: 120.00,
    estoque: 150,
    estoqueMinimo: 30,
    unidade: 'un',
    ativo: true,
    imagem: null,
  },
  {
    id: '2',
    nome: 'Flange Aço Inox 3"',
    descricao: 'Flange de aço inoxidável com furos padronizados',
    sku: 'FLA-INOX-3',
    categoria: 'Flanges',
    preco: 185.50,
    custoproduto: 85.00,
    estoque: 200,
    estoqueMinimo: 50,
    unidade: 'un',
    ativo: true,
    imagem: null,
  },
  {
    id: '3',
    nome: 'Parafuso Especial M12',
    descricao: 'Parafuso especial M12x50 em aço carbono',
    sku: 'PAR-M12-ESP',
    categoria: 'Parafusos',
    preco: 5.75,
    custoproduto: 2.50,
    estoque: 5000,
    estoqueMinimo: 1000,
    unidade: 'un',
    ativo: true,
    imagem: null,
  },
];

// Inicializar dados mock
if (!localStorage.getItem('nomus_erp_produtos')) {
  storage.set('produtos', MOCK_PRODUTOS);
}

export const produtoService = {
  // Listar produtos
  async getAll() {
    return storage.get('produtos', MOCK_PRODUTOS);
  },

  // Obter produto por ID
  async getById(id) {
    const produtos = storage.get('produtos', MOCK_PRODUTOS);
    return produtos.find(p => p.id === id) || null;
  },

  // Criar novo produto
  async create(produto) {
    const produtos = storage.get('produtos', MOCK_PRODUTOS);
    const novo = {
      ...produto,
      id: Date.now().toString(),
      ativo: true,
    };
    storage.set('produtos', [...produtos, novo]);
    return novo;
  },

  // Atualizar produto
  async update(id, data) {
    const produtos = storage.get('produtos', MOCK_PRODUTOS);
    const updated = produtos.map(p =>
      p.id === id ? { ...p, ...data } : p
    );
    storage.set('produtos', updated);
    return { id, ...data };
  },

  // Deletar produto
  async delete(id) {
    const produtos = storage.get('produtos', MOCK_PRODUTOS);
    storage.set('produtos', produtos.filter(p => p.id !== id));
  },

  // Buscar por categoria
  async getByCategoria(categoria) {
    const produtos = await this.getAll();
    return produtos.filter(p => p.categoria === categoria);
  },

  // Buscar produtos com estoque baixo
  async getEstoqueBaixo() {
    const produtos = await this.getAll();
    return produtos.filter(p => p.estoque <= p.estoqueMinimo);
  },

  // Buscar por SKU
  async getBySku(sku) {
    const produtos = await this.getAll();
    return produtos.find(p => p.sku === sku) || null;
  },

  // Atualizar estoque
  async atualizarEstoque(id, novaQuantidade) {
    return this.update(id, { estoque: novaQuantidade });
  },

  // Obter categorias únicas
  async getCategorias() {
    const produtos = await this.getAll();
    const categorias = new Set(produtos.map(p => p.categoria));
    return Array.from(categorias);
  },

  // Calcular valor total do estoque
  async getValorTotalEstoque() {
    const produtos = await this.getAll();
    return produtos.reduce((total, p) => total + (p.estoque * p.custoproduto), 0);
  },

  // Listener reservado para futuras atualizacoes em tempo real via API
  onProdutosChange(callback) {
    // Modo local: retorna unsubscribe noop
    return () => {};
  },

  // Buscar (search)
  async search(termo) {
    const produtos = await this.getAll();
    const termo_lower = termo.toLowerCase();
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(termo_lower) ||
      p.descricao.toLowerCase().includes(termo_lower) ||
      p.sku.toLowerCase().includes(termo_lower)
    );
  },
};
