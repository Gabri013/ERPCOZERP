# ERP COZ - Sistema de Gestão Empresarial

## Visão Geral

O ERP COZ é um sistema completo de gestão empresarial desenvolvido para pequenas e médias empresas, com foco em manufatura e distribuição. O sistema integra módulos de vendas, compras, estoque, produção, financeiro, CRM, RH e muito mais.

## Arquitetura

### Backend
- **Node.js + Express**: API RESTful com TypeScript
- **Prisma + PostgreSQL**: ORM e banco de dados relacional
- **Redis**: Cache para performance
- **JWT**: Autenticação e autorização
- **Winston**: Logging estruturado
- **Helmet + CORS**: Segurança

### Frontend
- **React 18 + Vite**: SPA moderna
- **Tailwind CSS**: Estilização responsiva
- **React Router**: Navegação
- **React Hot Toast**: Notificações
- **Axios**: Cliente HTTP

## Módulos Principais

1. **Vendas**: Pedidos de venda, orçamentos, clientes
2. **Compras**: Ordens de compra, fornecedores
3. **Estoque**: Controle de produtos, movimentações
4. **Produção**: Ordens de produção, BOM
5. **Financeiro**: Contas a receber/pagar, fluxo de caixa
6. **CRM**: Oportunidades, atividades, pipeline
7. **RH**: Funcionários, setores, permissões
8. **Fiscal**: NF-e, SPED, obrigações

## Desenvolvimento

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker (opcional)

### Instalação
```bash
# Backend
cd apps/backend
npm install
cp .env.example .env
# Configurar DATABASE_URL, JWT_SECRET, etc.

# Frontend
cd apps/frontend
npm install
```

### Execução
```bash
# Backend
npm run dev

# Frontend
npm run dev
```

## Deploy

### Desenvolvimento
```bash
npm run start-dev
```

### Produção
- Railway: `deploy-railway.ps1`
- Local: `deploy-local.ps1`

## Segurança

- Autenticação JWT com refresh tokens
- Autorização baseada em roles e permissões
- Validação de entrada com express-validator
- Proteção contra SQL injection
- Headers de segurança (Helmet)
- Rate limiting
- Auditoria de sessões suspeitas

## Performance

- Cache Redis para queries pesadas
- Indexes otimizados no banco
- Paginação em endpoints
- Compressão de respostas

## Testes

- Unit tests com Vitest
- Integration tests com Supertest
- E2E tests com Playwright

## Monitoramento

- Logs estruturados com Winston
- Health checks
- Error monitoring
- Performance metrics

## API Documentation

A API segue padrões RESTful com respostas JSON padronizadas:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

## Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.