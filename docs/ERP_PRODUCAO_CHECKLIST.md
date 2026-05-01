## Objetivo
Deixar o ERP **100% funcional para produção** sem precisar mexer em código no dia a dia (no-code para usuários; ajustes visuais/avançados só por designer/programador).

## Regras de validação (sempre)
- **Testar no site** após cada mudança: clicar fluxo real, observar console e garantir que não há erros.
- **Sem mocks em produção**: qualquer tela que ainda use dados mock deve sinalizar “Em migração” e apontar o endpoint/core necessário.
- **Responsivo**: desktop, tablet e mobile (tabelas com overflow, botões acessíveis, modais navegáveis por teclado).
- **Acessibilidade**: Dialogs com título/descrição, botões com `aria-label` quando só ícone, foco visível.

## Checklist por módulo

### Core / Infra
- [ ] Auth: login, `/api/auth/me`, logout
- [ ] RBAC: `/api/permissions/me`, sidebar por módulo
- [ ] Docker: compose produção, healthchecks, seeds controlados

### Header
- [x] Busca global (Ctrl+K) funcional
- [x] Ajuda funcional (`/ajuda`)
- [x] Logout real (AuthContext)
- [x] Notificações reais (Postgres) + marcar lidas
- [ ] Notificações por setor/pessoa (não genéricas)

### Dashboard
- [x] Personalizar / Padrão persistindo no backend (layout por usuário)
- [ ] Widgets com dados reais por setor (Vendas/Engenharia/Produção/Qualidade/Expedição/Compras/Financeiro)
- [ ] KPIs e gráficos sem dados mock (ou sinalizar “em migração”)

### Vendas (Clientes / Pedidos / Orçamentos)
- [ ] Clientes core: CRUD + filtros + validações
- [ ] Pedidos: criar → aprovar → virar OP (fluxo inox)
- [ ] Orçamentos: orçamento → pedido → OP

### Engenharia / Produto
- [ ] Produto padrão e produto sob medida (estrutura e BOM)
- [ ] Roteiro/processos (Engenharia → Programação → Corte → Dobra → Tubo → Solda → Mobiliário → Cocção → Refrigeração → Embalagem)

### Produção
- [ ] OP: criar, detalhar, imprimir PDF modelo (formulário)
- [ ] Apontamento: por setor + permissões por perfil
- [ ] Chão de fábrica: fila por setor, OPs em andamento, gargalos
- [ ] Qualidade: inspeção, não conformidade, liberação
- [ ] Expedição: embalagem, checklist, envio

### Estoque / Movimentações
- [ ] Produtos: CRUD + foto + mínimos
- [ ] Movimentações: entrada/saída por OP/OC
- [ ] Inventário / endereçamento

### Compras
- [ ] Fornecedores
- [ ] Ordem de compra (OC) core: CRUD + status + recebimento

### Financeiro
- [ ] Contas a pagar/receber (core)
- [ ] Relatórios (DRE, fluxo, vencidos)

### RH
- [ ] Funcionários / ponto / folha (core ou sinalizar migração)

## Próximas ações (curto prazo)
- Notificações: adicionar **setor** + criar notificações por evento (estoque baixo, OP atrasada, QC pendente).
- Dashboard: criar widgets “por setor” usando dados reais do core (EntityRecords) + filas de produção quando o módulo de produção estiver no core.
- Import: analisar `127_0_0_1.sql` (MariaDB) e definir estratégia de migração/seed para Postgres (ETL).

