# VALIDATION_REPORT — ERP COZINCA INOX (QA / Automação)

**Data:** 2026-05-01  
**Escopo:** Validação exaustiva solicitada (todos os perfis, módulos, CRUD, responsividade, menu lateral).  
**Limitação real:** O backend **não estava aceitando conexões** em `http://127.0.0.1:3001` no momento da execução automatizada; o frontend respondeu **HTTP 200** em `http://127.0.0.1:5173`. Com isso, **não foi possível** concluir login + CRUD end-to-end contra API real nesta sessão; os testes manuais perfil-a-perfil no browser **não foram repetidos em tempo real** para os 12 perfis listados. Este relatório combina **evidência de automação**, **sonda de ambiente** e **análise estática** (seed de permissões × `Sidebar.jsx` × rotas).

---

## 1. Resumo

| Métrica | Valor |
|--------|--------|
| Testes automatizados executados (Playwright) | 1 |
| Passaram | 0 |
| Falharam | 1 |
| Perfis testados com login real (API OK) | 0 (API indisponível) |
| Módulos percorridos manualmente (browser) | Não executado (bloqueio API) |
| Análise estática de permissões × menu | **Sim** (todos os itens do `Sidebar`) |

**Conclusão:** A suíte E2E existente **falhou** na etapa de **POST** após abrir o modal de produto — compatível com **proxy Vite → :3001** sem serviço escutando (timeout 20s em `/api/estoque`). Para uma validação “em produção Docker” completa, é obrigatório subir o stack (`docker compose up` ou equivalente) e **reexecutar** Playwright + roteiro manual abaixo.

---

## 2. Ambiente verificado

| Endpoint | Resultado |
|----------|-----------|
| `GET http://127.0.0.1:5173/` | **200** (Vite servindo SPA) |
| `GET http://127.0.0.1:3001/health` | **Conexão recusada** (nenhum listener) |

Configuração relevante: `apps/frontend/vite.config.js` encaminha `/api` para `VITE_BACKEND_URL` ou `http://127.0.0.1:3001`. Sem backend, **login pode falhar** ou **CRUD não persiste**, gerando 502/timeout no Network.

---

## 3. Evidência Playwright

**Arquivo:** `tests/e2e/auth-and-estoque-produtos.spec.ts`  
**Comando:** `npx playwright test`  

**Falha:**

- `TimeoutError` em `page.waitForResponse` aguardando `POST` em URL contendo `/api/estoque` com sucesso.
- Anexos gerados: `test-results/.../test-failed-1.png`, `video.webm`, `trace.zip`.

**Interpretação:** O fluxo chegou à página de Produtos após login (SPA OK); a persistência **não completou** por falha de rede/API.

---

## 4. Matriz de perfis — credenciais da especificação × seed real

A especificação lista **Financeiro** (`financeiro@cozinha.com`) e **RH** (`rh@cozinha.com`). No seed atual (`apps/backend/prisma/seed.ts`) **não existem** esses usuários — apenas, entre outros:

- `master@Cozinha.com` / `master123_dev`
- `gerente@cozinha.com` / `demo123_dev`
- `gerente.producao@cozinha.com` / `demo123_dev`
- `vendas@cozinha.com` / `demo123_dev`
- `engenharia@cozinha.com` / `demo123_dev`
- `laser@cozinha.com` … `expedicao@cozinha.com` / `demo123_dev`

**Achado crítico:** Não é possível validar os perfis “Financeiro” e “RH” conforme a tabela sem **criar usuários** ou **ajustar o seed**.

---

## 5. Visibilidade do menu lateral (análise estática seed × `Sidebar.jsx`)

Regra: cada item usa `pode(item.required)` com exceção do Dashboard (`alwaysShow`). **Master** recebe todas as permissões no backend (`/api/permissions/me`).

### 5.1 Divergências entre a especificação de QA e o seed

| Perfil (especificação) | O que a especificação diz | O que o seed realmente concede (resumo) |
|-------------------------|---------------------------|----------------------------------------|
| Gerente de Produção | Produção, Estoque, Compras (leitura), Qualidade | `ver_estoque`, produção completa, **sem `ver_compras`** → **sem menu Compras** |
| Projetista/Engenharia | Projetos, Produtos (BOM), Roteiros | `ver_op`, `ver_pcp`, `ver_roteiros`, **sem `ver_estoque`** → **sem link “Produtos”** (`ver_estoque` exigido) |
| Corte Laser | Produção, apontar | `ver_op`, `apontar`, `ver_chao_fabrica` apenas → **sem Kanban/PCP** (coerente com mínimo) |
| Expedição | “Apenas Pedidos de Venda (expedição)” | Seed: **sem `ver_pedidos`** → **não vê Vendas**; tem só OP + chão de fábrica |
| Qualidade | Produção + Relatórios Qualidade | Tem `ver_relatorios` + produção; **não há permissão “qualidade” separada** no menu |
| Financeiro / RH | Perfis dedicados | **Usuários inexistentes no seed** |

Estes itens são **gaps de produto/seed** ou **desalinhamento da matriz de QA**, não necessariamente bugs de código — devem ser decididos pelo negócio.

### 5.2 Gerente Geral (`gerente`)

Possui `editar_config`, `gerenciar_usuarios` (implícito via `allGranularCodes` + lista), `ver_*` amplo. **Vê Configurações** completo — a especificação diz “exceto Configurações de sistema”: **o comportamento atual do app é mostrar Configurações** para `gerente`.

### 5.3 Operadores (laser, dobra, solda)

Menu esperado: basicamente **Produção** (parcial). Sem `ver_pedidos`, **Vendas** some; sem `ver_financeiro`, **Financeiro** some; sem `ver_rh`, **RH** some — **alinhado** ao seed.

---

## 6. Permissões e API (`/api/permissions/me`)

- Usuários não-master recebem lista plana de `permissions`.
- Objeto `modules` é **heurístico** (`permissions.routes.ts`): usa `includes('op')`, `includes('cliente')`, etc. Risco: **falso positivo/negativo** se códigos de permissão mudarem (ex.: substring acidental).
- O **menu lateral não usa `modules`** para os itens estáticos; usa **`pode('ver_pedidos')`**. Inconsistências entre `modules` e sidebar são possíveis para consumidores futuros de `podeVerModulo`.

---

## 7. Frontend — bugs / riscos (revisão de código, não runtime completo)

| ID | Área | Descrição | Severidade |
|----|------|-----------|------------|
| F1 | Ambiente | Backend down → todos os CRUDs falham | **Bloqueante** até subir API |
| F2 | Seed | Faltam usuários `financeiro@` e `rh@` da matriz de QA | **Alta** para testes |
| F3 | Produto | Projetista não tem `ver_estoque`: rota `/entidades/produto` invisível | **Alta** se engenharia deve editar BOM |
| F4 | Expedição | Seed não alinha com “só Pedidos de Venda” | **Média** (regra de negócio) |
| F5 | Gerente produção | Sem `ver_compras`: não há leitura Compras no menu | **Média** vs especificação QA |
| F6 | Gerente | Vê Configurações; especificação diz o contrário | **Baixa** (documentação vs produto) |
| F7 | `modules` API | Heurística frágil por substring | **Baixa** |

**Responsividade / menu lateral:** Não foi validado em 375px/768px nesta execução (sem sessão browser longa). Reexecutar com backend no ar + DevTools.

---

## 8. Comportamento de botões (genérico)

Sem API:

- **Salvar** em formulários que chamam `/api/*` tende a falhar ou toast de erro.
- **403** esperado se permissão granular negar (`entityRouteGuard`) — não reproduzido sem login válido + backend.

Com API no ar, recomenda-se repetir por módulo:

1. **Novo** → preencher mínimo → **Salvar** → Network **201/200**, lista atualiza.
2. **Editar** → **Salvar** → PUT OK.
3. **Excluir** → confirmar → DELETE OK.

---

## 9. Recomendações prioritárias

1. **Subir o backend** na porta documentada (3001) ou documentar a porta real do Docker e alinhar `VITE_BACKEND_URL` / proxy.
2. **Adicionar ao seed** usuários `financeiro@cozinha.com` e `rh@cozinha.com` (ou ajustar a matriz de QA para usuários existentes).
3. **Alinhar regras de negócio** com o seed: Expedição (Pedidos vs Produção), Gerente Produção (Compras leitura), Projetista (acesso a Produtos/BOM).
4. **Reexecutar** `npx playwright test` e expandir E2E (login por perfil + smoke por rota).
5. **Teste manual checklist** (com API OK): para cada perfil, exportar screenshot do sidebar + uma captura de Network na primeira ação CRUD.

---

## 10. Contagem final (declaração honesta)

| Tipo | Quantidade |
|------|------------|
| Testes automatizados executados | 1 |
| Passou | 0 |
| Falhou | 1 |
| Perfis validados end-to-end na API real | 0 |
| Itens de menu analisados estaticamente | 100% da definição em `Sidebar.jsx` |
| Módulos “clicados” em todos os perfis | **Não concluído** (bloqueio + ausência de usuários QA) |

---

*Relatório gerado conforme metodologia solicitada; completar validação exaustiva requer ambiente Docker/API estável e usuários de teste alinhados ao seed.*
