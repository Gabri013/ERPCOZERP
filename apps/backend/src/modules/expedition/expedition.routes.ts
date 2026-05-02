import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  listExpeditionOrders, getExpeditionOrder, createExpeditionOrder, updateExpeditionOrder, deleteExpeditionOrder,
  addLoad, updateLoad, deleteLoad,
  listManifests, createManifest, updateManifest,
  getExpeditionStats,
} from './expedition.service.js';

export const expeditionRouter = Router();
expeditionRouter.use(authenticate);

expeditionRouter.get('/stats', async (_req, res) => {
  try { res.json(await getExpeditionStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Orders
expeditionRouter.get('/', async (req, res) => {
  try { res.json(await listExpeditionOrders(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
expeditionRouter.get('/:id', async (req, res) => {
  try {
    const order = await getExpeditionOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
expeditionRouter.post('/', async (req, res) => {
  try { res.status(201).json(await createExpeditionOrder(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
expeditionRouter.put('/:id', async (req, res) => {
  try { res.json(await updateExpeditionOrder(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
expeditionRouter.delete('/:id', async (req, res) => {
  try { await deleteExpeditionOrder(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Loads
expeditionRouter.post('/:id/loads', async (req, res) => {
  try { res.status(201).json(await addLoad(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
expeditionRouter.put('/:id/loads/:loadId', async (req, res) => {
  try { res.json(await updateLoad(req.params.loadId, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
expeditionRouter.delete('/:id/loads/:loadId', async (req, res) => {
  try { await deleteLoad(req.params.loadId); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Manifests
expeditionRouter.get('/manifests/list', async (req, res) => {
  try { res.json(await listManifests(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
expeditionRouter.post('/:id/manifests', async (req, res) => {
  try { res.status(201).json(await createManifest(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
expeditionRouter.put('/manifests/:manifestId', async (req, res) => {
  try { res.json(await updateManifest(req.params.manifestId, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
