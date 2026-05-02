import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  incrementViews,
  likeArticle,
  addRevision,
  addAttachment,
  getKnowledgeStats,
} from './knowledge.service.js';

export const knowledgeRouter = Router();
knowledgeRouter.use(authenticate);

knowledgeRouter.get('/stats', async (_req, res) => {
  try { res.json(await getKnowledgeStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Categories
knowledgeRouter.get('/categories', async (_req, res) => {
  try { res.json(await listCategories()); } catch (e) { res.status(500).json({ error: String(e) }); }
});
knowledgeRouter.post('/categories', async (req, res) => {
  try { res.status(201).json(await createCategory(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
knowledgeRouter.put('/categories/:id', async (req, res) => {
  try { res.json(await updateCategory(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
knowledgeRouter.delete('/categories/:id', async (req, res) => {
  try { await deleteCategory(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Articles
knowledgeRouter.get('/articles', async (req, res) => {
  try {
    const { categoryId, status, search } = req.query as Record<string, string>;
    res.json(await listArticles({ categoryId, status, search }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
knowledgeRouter.get('/articles/:id', async (req, res) => {
  try {
    const article = await getArticle(req.params.id);
    if (!article) return res.status(404).json({ error: 'Not found' });
    await incrementViews(article.id);
    res.json(article);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
knowledgeRouter.post('/articles', async (req, res) => {
  try { res.status(201).json(await createArticle(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
knowledgeRouter.put('/articles/:id', async (req, res) => {
  try { res.json(await updateArticle(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
knowledgeRouter.delete('/articles/:id', async (req, res) => {
  try { await deleteArticle(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});
knowledgeRouter.post('/articles/:id/like', async (req, res) => {
  try { res.json(await likeArticle(req.params.id)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
knowledgeRouter.post('/articles/:id/revisions', async (req, res) => {
  try { res.status(201).json(await addRevision(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
knowledgeRouter.post('/articles/:id/attachments', async (req, res) => {
  try { res.status(201).json(await addAttachment(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
