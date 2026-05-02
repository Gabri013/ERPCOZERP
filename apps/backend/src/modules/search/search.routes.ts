import { Router } from 'express';
import { globalSearch } from './search.service.js';

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  try {
    const data = await globalSearch(q);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erro na busca' });
  }
});
