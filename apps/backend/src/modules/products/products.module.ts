import type { Express } from 'express';
import { productsRouter } from './products.routes.js';

export function registerProductsModule(app: Express) {
  app.use('/api/products', productsRouter);
}
