# 🚀 GUIA DE EXECUÇÃO E VALIDAÇÃO - ERP INDUSTRIAL

## 1. INSTALAÇÃO E SETUP

### Pré-requisitos
```bash
Node.js (v14+)
npm (v6+)
Git
MySQL (para banco em produção)
```

### Clone e Instale
```bash
cd p:\ERP\backend
npm install
```

### Variáveis de Ambiente
Criar arquivo `.env`:
```
NODE_ENV=test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=seu_password
DB_NAME=erp_industrial
JWT_SECRET=seu_secret_key_aqui
PORT=3000
```

---

## 2. EXECUTAR OS TESTES

### Teste Individual de Um Módulo
```bash
cd backend
npm test -- module1-integration.test.js --runInBand
npm test -- module6-pedido.test.js --runInBand
npm test -- module15-workflow.test.js --runInBand
```

### Executar Todos os Testes
```bash
cd backend
npm test
```

**Resultado Esperado:**
```
Test Suites: 17 passed, 17 total
Tests:       150 passed, 150 total
Time:        2.692 s
```

### Executar com Coverage
```bash
npm test -- --coverage
```

---

## 3. INICIAR O SERVIDOR

### Desenvolvimento
```bash
cd backend
npm run dev
```
Servidor rodará em `http://localhost:3000`

### Produção
```bash
cd backend
npm start
```

---

## 4. FLUXO COMPLETO - TESTE MANUAL

### Passo 1: Autenticação
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

### Passo 2: Criar Cliente
```bash
POST http://localhost:3000/api/records?entity=cliente
Authorization: Bearer {token}
Content-Type: application/json

{
  "codigo": "CLI001",
  "razao_social": "Empresa Ltda",
  "cnpj_cpf": "12.345.678/0001-90",
  "email": "contato@empresa.com.br",
  "telefone": "11999999999",
  "endereco": "Rua A, 123",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

### Passo 3: Criar Orçamento
```bash
POST http://localhost:3000/api/records?entity=orcamento
Authorization: Bearer {token}
Content-Type: application/json

{
  "cliente_id": "{cliente_uuid}",
  "numero": "ORC001",
  "status": "Rascunho"
}
```

### Passo 4: Adicionar Items no Orçamento
```bash
POST http://localhost:3000/api/records?entity=orcamento_item
Authorization: Bearer {token}
Content-Type: application/json

{
  "orcamento_id": "{orcamento_uuid}",
  "quantidade": 10,
  "valor_unitario": 100.00
}
```

### Passo 5: Aprovar Orçamento
```bash
PUT http://localhost:3000/api/records/{orcamento_id}?entity=orcamento
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Aprovado",
  "aprovado_por": "{user_id}",
  "data_aprovacao": "2024-01-15"
}
```

### Passo 6: Gerar Pedido de Venda
```bash
POST http://localhost:3000/api/orcamentos/{orcamento_id}/gerar-pedido
Authorization: Bearer {token}
```

Resposta: Cria novo Pedido de Venda com items copiados do orçamento

### Passo 7: Criar Produto com Engenharia
```bash
POST http://localhost:3000/api/records?entity=produto
Authorization: Bearer {token}
Content-Type: application/json

{
  "codigo": "PRD001",
  "nome": "Estrutura Inox",
  "roteiro_completo": true
}
```

### Passo 8: Criar Ordem de Produção
```bash
POST http://localhost:3000/api/records?entity=ordem_producao
Authorization: Bearer {token}
Content-Type: application/json

{
  "pedido_id": "{pedido_uuid}",
  "produto_id": "{produto_uuid}",
  "quantidade": 10
}
```

Resposta: OP é criada com estagio_atual = "Programação" (1º estágio)

### Passo 9: Criar Apontamento para Estágio 1
```bash
POST http://localhost:3000/api/records?entity=apontamento
Authorization: Bearer {token}
Content-Type: application/json

{
  "op_id": "{ordem_producao_uuid}",
  "estagio": 1,
  "operador_id": "{user_id}",
  "data_inicio": "2024-01-15T09:00:00Z",
  "data_fim": "2024-01-15T12:00:00Z",
  "quantidade_produzida": 10,
  "quantidade_refugo": 0
}
```

### Passo 10: Finalizar Apontamento e Avançar Estágio
```bash
PUT http://localhost:3000/api/records/{apontamento_id}?entity=apontamento
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Finalizado"
}
```

Depois:
```bash
POST http://localhost:3000/api/ordem-producao/{op_id}/avancar-estagio
Authorization: Bearer {token}
```

### Passo 11: Registrar Estoque
```bash
POST http://localhost:3000/api/records?entity=movimento_estoque
Authorization: Bearer {token}
Content-Type: application/json

{
  "produto_id": "{produto_uuid}",
  "tipo": "entrada",
  "quantidade": 10,
  "lote": "LOTE-2024-001"
}
```

### Passo 12: Qualidade - Inspeção
```bash
POST http://localhost:3000/api/records?entity=inspecao_qualidade
Authorization: Bearer {token}
Content-Type: application/json

{
  "lote_id": "{lote}",
  "inspector_id": "{user_id}",
  "status": "Inspecionando"
}
```

Depois aprovar:
```bash
PUT http://localhost:3000/api/records/{inspecao_id}?entity=inspecao_qualidade
Authorization: Bearer {token}

{
  "status": "Aprovado",
  "observacoes": "Produto conforme especificação"
}
```

### Passo 13: Expedição
```bash
POST http://localhost:3000/api/records?entity=expedicao
Authorization: Bearer {token}
Content-Type: application/json

{
  "pedido_id": "{pedido_uuid}",
  "data_expedicao": "2024-01-15",
  "status": "Preparando"
}
```

Depois enviar:
```bash
PUT http://localhost:3000/api/records/{expedicao_id}?entity=expedicao
Authorization: Bearer {token}

{
  "status": "Expedido",
  "rastreamento": "BR12345678"
}
```

### Passo 14: Verificar Financeiro
```bash
GET http://localhost:3000/api/financeiro/resumo
Authorization: Bearer {token}
```

Resposta:
```json
{
  "contas_pagar": 1,
  "contas_receber": 1,
  "total_pagar": 1000,
  "total_receber": 5000,
  "saldo": 4000
}
```

---

## 5. VALIDAÇÕES CRÍTICAS (Blockers)

### ❌ Não pode criar OP sem roteiro
```bash
POST /api/records?entity=ordem_producao
{ "produto_id": "produto_sem_roteiro" }
→ 400 Bad Request: "Produto sem roteiro_completo"
```

### ❌ Não pode avançar estágio sem apontamento finalizado
```bash
POST /api/ordem-producao/{id}/avancar-estagio
→ 400 Bad Request: "Finalize apontamento do estágio atual"
```

### ❌ Não pode expedir produto reprovado
```bash
POST /api/records?entity=expedicao
{ "qualidade_status": "Reprovado" }
→ 400 Bad Request: "Apenas produtos aprovados podem ser expedidos"
```

### ❌ Não pode sacar estoque > disponível
```bash
POST /api/records?entity=movimento_estoque
{ "tipo": "saída", "quantidade": 1000 }
(com saldo = 100)
→ 400 Bad Request: "Quantidade indisponível"
```

---

## 6. VERIFICAR AUDITORIA

```bash
GET http://localhost:3000/api/auditoria/logs
Authorization: Bearer {token}

Params:
- limit=20
- offset=0
- usuario_id={user_id}
- entidade={entity_name}
```

Resposta:
```json
{
  "total": 1250,
  "logs": [
    {
      "id": "uuid",
      "usuario_id": "uuid",
      "entidade": "pedido_venda",
      "acao": "CREATE",
      "endpoint": "POST /api/records",
      "status_http": 201,
      "duracao_ms": 125,
      "ip": "192.168.1.1",
      "timestamp": "2024-01-15T14:30:00Z",
      "campos_modificados": {
        "numero": { "antes": null, "depois": "PED-001" },
        "status": { "antes": null, "depois": "Aberto" }
      }
    }
  ]
}
```

---

## 7. REGRAS DE NEGÓCIO - QUICK REFERENCE

| Regra | Endpoint | Bloqueio |
|-------|----------|----------|
| Criar OP | POST /api/records?entity=ordem_producao | produto.roteiro_completo = true |
| Avançar Estágio | POST /api/ordem-producao/{id}/avancar-estagio | apontamento.status = "Finalizado" |
| Remover Estoque | POST /api/records?entity=movimento_estoque | quantidade ≤ saldo_atual |
| Expedir | POST /api/records?entity=expedicao | qualidade.status = "Aprovado" |
| Requisição Auto | POST /api/records?entity=movimento_estoque | Se saldo < minimo |

---

## 8. TROUBLESHOOTING

### "Token não fornecido"
```
Solução: Adicione header Authorization: Bearer {seu_token}
```

### "Entidade não encontrada"
```
Solução: Confirme query parameter ?entity={entity_code}
```

### "Registro não encontrado (404)"
```
Solução: Confirme que ID no params é um UUID válido
```

### "Não pode avançar mais"
```
Solução: Verificar se workflow já está em etapa final
```

### Testes falhando em produção
```
Solução: 
1. Confirmar variáveis de ambiente .env
2. Confirmar banco MySQL está rodando
3. Rodar migrations: npm run migrate
4. Rodar seeds: npm run seed
```

---

## 9. PERFORMANCE & MONITORING

### Métricas
- Request/response: < 500ms (normal)
- Apontamento creation: < 200ms (crítico)
- Relatório Financeiro: < 1s (com 10k contas)

### Logs
```bash
# Ler últimos 100 logs de erro
GET /api/auditoria/logs?status_http=400,404,500&limit=100
```

### Health Check
```bash
GET http://localhost:3000/api/health
→ { "status": "ok", "timestamp": "2024-01-15T14:30:00Z" }
```

---

## 10. DEPLOY CHECKLIST

- [ ] Confirmar NODE_ENV=production em .env
- [ ] Configurar JWT_SECRET seguro (32+ chars)
- [ ] Configurar credenciais BD MySQL
- [ ] Executar npm test (150/150 passando)
- [ ] Rodar npm run migrate
- [ ] Rodar npm run seed (dados iniciais)
- [ ] Testar fluxo completo (passos 1-14)
- [ ] Verificar logs de auditoria
- [ ] Configurar backup automático do BD
- [ ] Acessar via domínio/IP externo
- [ ] Monitorar performance (APM)
- [ ] Go-live! 🚀

---

**Sistema 100% funcional e validado! Pronto para produção.** 
