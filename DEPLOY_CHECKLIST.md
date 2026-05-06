# Checklist de Deploy - ERP COZ

## Pré-Deploy

- [ ] Executar todos os testes: `npm test`
- [ ] Verificar linting: `npm run lint`
- [ ] Build de produção: `npm run build`
- [ ] Verificar variáveis de ambiente (.env)
- [ ] Backup do banco de dados
- [ ] Verificar conectividade com PostgreSQL
- [ ] Verificar conectividade com Redis
- [ ] Executar migrations: `npm run prisma:migrate`
- [ ] Executar seeders se necessário: `npm run prisma:seed`

## Segurança

- [ ] JWT_SECRET configurado e seguro
- [ ] DATABASE_URL sem credenciais hardcoded
- [ ] FRONTEND_URL configurado corretamente
- [ ] Headers de segurança (Helmet) ativos
- [ ] CORS configurado para domínios permitidos
- [ ] Rate limiting ativo
- [ ] Validação de entrada implementada
- [ ] Auditoria de sessões ativa

## Performance

- [ ] Cache Redis configurado
- [ ] Indexes do banco aplicados
- [ ] Paginação implementada em endpoints pesados
- [ ] Compressão de respostas ativa

## Monitoramento

- [ ] Logs estruturados configurados
- [ ] Health checks funcionando
- [ ] Error monitoring ativo
- [ ] Métricas de performance coletadas

## Deploy

- [ ] Deploy do backend
- [ ] Deploy do frontend
- [ ] Verificar health endpoint: `/health`
- [ ] Testar login e funcionalidades básicas
- [ ] Verificar permissões e roles
- [ ] Testar integração com banco
- [ ] Verificar cache funcionando

## Pós-Deploy

- [ ] Executar smoke tests
- [ ] Monitorar logs por 24h
- [ ] Verificar performance
- [ ] Notificar usuários sobre nova versão
- [ ] Documentar mudanças no changelog

## Rollback Plan

- [ ] Backup da versão anterior
- [ ] Script de rollback preparado
- [ ] Dados críticos backupados
- [ ] Contato de emergência definido

## Checklist por Ambiente

### Desenvolvimento
- [ ] Testes automatizados passando
- [ ] Linting sem erros
- [ ] Build successful

### Staging
- [ ] Todos os testes de integração passando
- [ ] Dados de teste populados
- [ ] Performance baseline estabelecida

### Produção
- [ ] Checklist completo executado
- [ ] Aprovação do PO/Tech Lead
- [ ] Janela de manutenção agendada
- [ ] Plano de comunicação com usuários