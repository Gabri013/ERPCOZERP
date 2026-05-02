# DASHBOARD_ROLES_REPORT — Dashboards Personalizados por Perfil

**Data:** 2026-05-02  
**Sistema:** ERP COZINCA INOX  
**Status:** ✅ Implementado e funcionando

---

## 1. Correções Aplicadas

### 1.1 `DashboardConfigurador.jsx` — Bug crítico corrigido

**Problema:**  
O componente tinha um `useEffect` com dependência `[ativos]` que chamava `setSelecionados(new Set(ativos))` a cada mudança do prop. Isso era redundante (o pai já usa `key={widgetIds.join('|')}` para remontar o componente quando o layout muda) e criava uma race condition: qualquer re-render do Dashboard que passasse um novo array `ativos` resetaria silenciosamente as seleções do usuário antes de salvar.

**Correção:**
```diff
- useEffect(() => {
-   setSelecionados(new Set(Array.isArray(ativos) ? [...ativos] : []));
- }, [ativos]);
```

O `useState` agora usa apenas o inicializador lazy `() => new Set(ativos)`. O componente pai já garante remontagem via `key={widgetIds.join('|')}` quando o layout muda externamente.

### 1.2 `Dashboard.jsx` — Restaurar padrão fecha o modal

**Problema:**  
Ao clicar "Restaurar padrão" dentro do configurador, o modal permanecia aberto e sofria um remount (via mudança de `key`), causando confusão visual.

**Correção:**
```diff
  onReset={async () => {
+   setShowConfig(false);   // fecha o modal imediatamente
    await resetToDefault();  // aplica layout padrão e toast
  }}
```

O usuário agora vê o novo layout aplicado diretamente no dashboard.

---

## 2. Arquitetura do Sistema de Dashboard

```
Dashboard.jsx
├── useAuth() → user.id, user.roles, user.sector
├── primaryRole(roles) → roleCode (ex.: "gerente_producao")
├── deriveSectorLabelFromRole(roleCode) → label se sector vazio
│
├── Carregamento do layout (prioridade):
│   1. GET /api/dashboard/layout (backend)
│   2. localStorage (fallback offline)
│   3. getDefaultWidgetsByRole(roleCode, sector) (padrão por perfil)
│
├── resetToDefault()
│   1. POST /api/dashboard/layout/reset → retorna widgets do perfil
│   2. Fallback: dashboardConfig.reset(userId, roleCode, sector)
│   3. PUT /api/dashboard/layout (sincroniza backend)
│
└── DashboardConfigurador (key={widgetIds.join('|')})
    ├── Remontagem automática quando layout muda
    ├── selecionados: Set (local state, sem useEffect externo)
    ├── toggle(id): adiciona/remove da seleção em tempo real
    ├── Salvar: onSave(Array.from(selecionados))
    └── Restaurar: onReset() → fecha modal + resetToDefault()
```

---

## 3. Layouts Padrão por Perfil

### `master` / `gerente` — Diretoria / Gerência

| Widget ID | Tipo | Descrição |
|-----------|------|-----------|
| `kpi_vendas` | KPI 1×1 | Faturamento resumido |
| `kpi_producao` | KPI 1×1 | OPs em andamento |
| `kpi_financeiro` | KPI 1×1 | Indicadores financeiros |
| `chart_vendas_mes` | Gráfico 2×1 | Captação / vendas últimos 6 meses |
| `chart_producao_mes` | Gráfico 2×1 | OPs últimos 6 meses |
| `alertas_estoque` | Alerta 1×1 | Produtos abaixo do mínimo |
| `alertas_financeiro` | Alerta 1×1 | Contas vencidas |
| `alertas_pedidos` | Alerta 1×1 | Pedidos aguardando aprovação |
| `chart_lead_time` | Gráfico 2×1 | Lead time de produção |
| `top_produtos` | Tabela 2×1 | Top produtos |

---

### `gerente_producao` — Gerência de Produção

| Widget ID | Tipo | Descrição |
|-----------|------|-----------|
| `kpi_producao` | KPI 1×1 | OPs em andamento |
| `chart_producao_mes` | Gráfico 2×1 | OPs mês a mês |
| `alertas_estoque` | Alerta 1×1 | Estoque crítico |
| `chart_lead_time` | Gráfico 2×1 | Lead time |
| `chart_ops_atrasadas` | Gráfico 2×1 | OPs atrasadas |
| `chart_qualidade` | Gráfico 2×1 | Índice de qualidade / refugo |
| `chart_eficiencia` | Gráfico 2×1 | Eficiência do chão de fábrica |

---

### `orcamentista_vendas` — Vendas / Comercial

| Widget ID | Tipo | Descrição |
|-----------|------|-----------|
| `kpi_vendas` | KPI 1×1 | Faturamento |
| `chart_vendas_mes` | Gráfico 2×1 | Captação de clientes |
| `chart_conversao` | Gráfico 2×1 | Taxa de conversão |
| `top_produtos` | Tabela 2×1 | Top produtos vendidos |
| `alertas_pedidos` | Alerta 1×1 | Pedidos aguardando |
| `chart_funil_vendas` | Gráfico 2×1 | Funil de vendas (CRM) |

---

### `projetista` — Engenharia

| Widget ID | Tipo | Descrição |
|-----------|------|-----------|
| `kpi_projetos` | KPI 1×1 | Projetos / roteiros ativos |
| `chart_projetos_mes` | Gráfico 2×1 | Projetos por mês |
| `alertas_aprovacao` | Alerta 1×1 | BOMs pendentes de aprovação |
| `chart_carga_trabalho` | Gráfico 2×1 | Carga de trabalho da equipe |

---

### `corte_laser` / `dobra_montagem` / `solda` / `qualidade` / `expedicao` — Operador

| Widget ID | Tipo | Descrição |
|-----------|------|-----------|
| `kpi_producao` | KPI 1×1 | OPs em andamento |
| `chart_ops_hoje` | Gráfico 2×1 | OPs do dia |
| `alertas_estoque` | Alerta 1×1 | Estoque crítico (só visualização) |

> Operadores com setor `Expedição` ou `Produção` recebem layout ainda mais focado via `refineWidgetsBySector()`.

---

### `financeiro` — Financeiro

| Widget ID | Tipo | Descrição |
|-----------|------|-----------|
| `kpi_financeiro` | KPI 1×1 | Indicadores financeiros |
| `chart_receitas_despesas` | Gráfico 2×1 | Receitas vs despesas |
| `alertas_financeiro` | Alerta 1×1 | Contas vencidas |
| `chart_contas_vencer` | Gráfico 2×1 | Contas a vencer (próximos 30 dias) |
| `chart_dre` | Gráfico 2×1 | DRE resumo |

---

### `rh` — Recursos Humanos

| Widget ID | Tipo | Descrição |
|-----------|------|-----------|
| `kpi_funcionarios` | KPI 1×1 | Headcount / base ativa |
| `chart_ponto` | Gráfico 2×1 | Ponto eletrônico / presença |
| `alertas_ferias` | Alerta 1×1 | Férias próximas / solicitações |
| `chart_custos_folha` | Gráfico 2×1 | Custos de folha de pagamento |

---

### `user` (padrão genérico) — Acesso básico

| Widget ID | Tipo | Descrição |
|-----------|------|-----------|
| `kpi_vendas` | KPI 1×1 | Faturamento |
| `kpi_producao` | KPI 1×1 | OPs |
| `chart_vendas_mes` | Gráfico 2×1 | Vendas mês |
| `chart_producao_mes` | Gráfico 2×1 | Produção mês |
| `alertas_pedidos` | Alerta 1×1 | Pedidos |
| `alertas_estoque` | Alerta 1×1 | Estoque |

---

## 4. Catálogo Completo de Widgets Disponíveis

| ID | Label | Grupo | Tamanho |
|----|-------|-------|---------|
| `kpi_vendas` | KPI — Vendas / faturamento | KPIs | 1×1 |
| `kpi_producao` | KPI — Produção / OPs | KPIs | 1×1 |
| `kpi_financeiro` | KPI — Financeiro | KPIs | 1×1 |
| `kpi_projetos` | KPI — Projetos (engenharia) | KPIs | 1×1 |
| `kpi_funcionarios` | KPI — RH / headcount | KPIs | 1×1 |
| `kpi_faturamento` | KPI — Faturamento (legado) | KPIs | 1×1 |
| `kpi_pedidos` | KPI — Clientes ativos (legado) | KPIs | 1×1 |
| `kpi_ops` | KPI — OPs em andamento (legado) | KPIs | 1×1 |
| `kpi_estoque` | KPI — Itens em estoque (legado) | KPIs | 1×1 |
| `kpi_ocs` | KPI — Ordens de compra (legado) | KPIs | 1×1 |
| `kpi_notifs` | KPI — Notificações (legado) | KPIs | 1×1 |
| `chart_vendas_mes` | Gráfico — Vendas / captação (mês) | Gráficos | 2×1 |
| `chart_producao_mes` | Gráfico — Produção / OPs (mês) | Gráficos | 2×1 |
| `chart_lead_time` | Gráfico — Lead time | Gráficos | 2×1 |
| `chart_conversao` | Gráfico — Conversão | Gráficos | 2×1 |
| `chart_funil_vendas` | Gráfico — Funil de vendas | Gráficos | 2×1 |
| `chart_ops_atrasadas` | Gráfico — OPs atrasadas | Gráficos | 2×1 |
| `chart_qualidade` | Gráfico — Qualidade | Gráficos | 2×1 |
| `chart_eficiencia` | Gráfico — Eficiência | Gráficos | 2×1 |
| `chart_projetos_mes` | Gráfico — Projetos (mês) | Gráficos | 2×1 |
| `chart_carga_trabalho` | Gráfico — Carga de trabalho | Gráficos | 2×1 |
| `chart_ops_hoje` | Gráfico — OPs hoje | Gráficos | 2×1 |
| `chart_receitas_despesas` | Gráfico — Receitas x despesas | Gráficos | 2×1 |
| `chart_contas_vencer` | Gráfico — Contas a vencer | Gráficos | 2×1 |
| `chart_dre` | Gráfico — DRE (resumo) | Gráficos | 2×1 |
| `chart_ponto` | Gráfico — Ponto / presença | Gráficos | 2×1 |
| `chart_custos_folha` | Gráfico — Custos de folha | Gráficos | 2×1 |
| `top_produtos` | Tabela — Top produtos | Tabelas | 2×1 |
| `pedidos_recentes` | Tabela — Pedidos recentes | Tabelas | 2×1 |
| `estoque_critico` | Lista — Estoque crítico (legado) | Tabelas | 1×1 |
| `alertas_estoque` | Alertas — Estoque crítico | Informações | 1×1 |
| `alertas_financeiro` | Alertas — Financeiro | Informações | 1×1 |
| `alertas_pedidos` | Alertas — Pedidos / aprovações | Informações | 1×1 |
| `alertas_aprovacao` | Alertas — Aprovações (engenharia) | Informações | 1×1 |
| `alertas_ferias` | Alertas — Férias / RH | Informações | 1×1 |
| `alertas` | Painel — Alertas consolidados (legado) | Informações | 1×1 |

---

## 5. Fluxo de Carregamento do Dashboard

```
1. user.id disponível?
   ├── Sim → GET /api/dashboard/layout
   │   ├── widgets.length > 0 → usa layout salvo (personalizado)
   │   └── widgets vazio → fallback local ou padrão por perfil
   └── Não → usa padrão por perfil (sem salvar)

2. Sem resposta do backend →
   localStorage[nomus_erp_dashboard_cfg_{userId}]?
   ├── Válido → usa layout salvo localmente
   └── Não → getDefaultWidgetsByRole(roleCode, sector)

3. getDefaultWidgetsByRole(roleCode, sector):
   ├── Seleciona base por role
   ├── Aplica refineWidgetsBySector() se setor específico
   └── Retorna array de IDs validados (apenas IDs em KNOWN)
```

---

## 6. Dados Reais nos Widgets

Todos os widgets buscam dados reais da API:

| Widget | Fonte de dados |
|--------|---------------|
| KPI Vendas/Produção/Financeiro | `GET /api/dashboard` (agregações SQL) |
| Gráfico Vendas/Produção | `series.clientesPorMes`, `series.opsPorMes` via SQL |
| Alertas Estoque | `fetchEstoqueCriticoApi()` → produtos abaixo do mínimo |
| Alertas Financeiro | `fetchSaldoFinanceiroApi()` → contas vencidas |
| Alertas Pedidos | `fetchPedidosAguardandoAp()` → pedidos pendentes |
| Estoque Crítico | `fetchEstoqueCriticoApi()` → barra de progresso |
| Gráfico Financeiro | `GET /api/financial/cash-flow` |
| Pedidos Recentes | `GET /api/sales/orders` |

---

## 7. Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `apps/frontend/src/components/dashboard/DashboardConfigurador.jsx` | Removido `useEffect` que resetava seleção ao receber `ativos`; comentário explicativo adicionado |
| `apps/frontend/src/pages/Dashboard.jsx` | `onReset` fecha o modal antes de aplicar o padrão |

### Arquivos sem alteração (já corretos)

| Arquivo | Status |
|---------|--------|
| `apps/frontend/src/lib/defaultDashboardLayouts.js` | ✅ Completo — 8 perfis + refinamento por setor |
| `apps/frontend/src/services/dashboardConfig.js` | ✅ Completo — get/save/reset com localStorage |
| `apps/frontend/src/services/dashboardLayoutServiceApi.js` | ✅ Completo — getLayout/saveLayout/resetLayout |
| `apps/backend/src/modules/dashboard/dashboard.routes.ts` | ✅ Completo — GET/PUT layout + POST reset por role |
| `apps/backend/src/lib/defaultDashboardLayout.ts` | ✅ Completo — espelho do frontend |
| `apps/frontend/src/components/dashboard/WidgetKPI.jsx` | ✅ Dados reais da API |
| `apps/frontend/src/components/dashboard/WidgetGraficoVendas.jsx` | ✅ Recharts + dados reais |
| `apps/frontend/src/components/dashboard/WidgetGraficoProducao.jsx` | ✅ Recharts + dados reais |
| `apps/frontend/src/components/dashboard/WidgetGraficoFinanceiro.jsx` | ✅ Recharts + dados reais |
| `apps/frontend/src/components/dashboard/WidgetAlertas.jsx` | ✅ Alertas dinâmicos com links |
| `apps/frontend/src/components/dashboard/WidgetEstoqueCritico.jsx` | ✅ Barra de progresso por produto |
| `apps/frontend/src/components/dashboard/widgets/WidgetPlaceholder.jsx` | ✅ Fallback para IDs desconhecidos |

---

## 8. Como Testar

```bash
# 1. Subir ambiente
docker compose up -d

# 2. Login como master
# Acessar http://localhost:5173
# Credenciais: master@Cozinha.com / master123_dev
# → Dashboard deve mostrar 10 widgets (KPIs + gráficos + alertas)

# 3. Personalizar
# Clicar "Personalizar" → selecionar/desmarcar widgets
# → Contador "Salvar (N widgets)" deve atualizar em tempo real
# → Salvar → layout persiste após F5

# 4. Restaurar padrão
# Clicar "Padrão" (ou "Restaurar padrão" no modal)
# → Modal fecha, layout volta ao padrão do perfil

# 5. Testar outros perfis
# Login como financeiro@cozinha.com → deve ver 5 widgets financeiros
# Login como laser@cozinha.com → deve ver 3 widgets de produção
```
