import { createApp } from '../../app.js';

// Reutiliza a aplicação real — mesmos middlewares e rotas
export function createTestServer() {
  return createApp();
}
