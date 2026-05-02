import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  listInspectionPlans, createInspectionPlan, updateInspectionPlan, deleteInspectionPlan,
  listInspections, createInspection, updateInspection, deleteInspection,
  listNonConformities, createNonConformity, updateNonConformity, deleteNonConformity,
  listInstruments, createInstrument, updateInstrument, deleteInstrument,
  listDocuments, createDocument, updateDocument, deleteDocument,
  listDatabooks, createDatabook, updateDatabook, deleteDatabook,
  addDatabookDocument, updateDatabookDocument,
  getQualityStats,
} from './quality.service.js';

export const qualityRouter = Router();
qualityRouter.use(authenticate);

qualityRouter.get('/stats', async (_req, res) => {
  try { res.json(await getQualityStats()); } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Inspection Plans
qualityRouter.get('/inspection-plans', async (req, res) => {
  try { res.json(await listInspectionPlans(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
qualityRouter.post('/inspection-plans', async (req, res) => {
  try { res.status(201).json(await createInspectionPlan(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.put('/inspection-plans/:id', async (req, res) => {
  try { res.json(await updateInspectionPlan(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.delete('/inspection-plans/:id', async (req, res) => {
  try { await deleteInspectionPlan(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Inspections
qualityRouter.get('/inspections', async (req, res) => {
  try { res.json(await listInspections(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
qualityRouter.post('/inspections', async (req, res) => {
  try { res.status(201).json(await createInspection(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.put('/inspections/:id', async (req, res) => {
  try { res.json(await updateInspection(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.delete('/inspections/:id', async (req, res) => {
  try { await deleteInspection(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Non-Conformities
qualityRouter.get('/nc', async (req, res) => {
  try { res.json(await listNonConformities(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
qualityRouter.post('/nc', async (req, res) => {
  try { res.status(201).json(await createNonConformity(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.put('/nc/:id', async (req, res) => {
  try { res.json(await updateNonConformity(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.delete('/nc/:id', async (req, res) => {
  try { await deleteNonConformity(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Instruments
qualityRouter.get('/instruments', async (req, res) => {
  try { res.json(await listInstruments(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
qualityRouter.post('/instruments', async (req, res) => {
  try { res.status(201).json(await createInstrument(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.put('/instruments/:id', async (req, res) => {
  try { res.json(await updateInstrument(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.delete('/instruments/:id', async (req, res) => {
  try { await deleteInstrument(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Documents
qualityRouter.get('/documents', async (req, res) => {
  try { res.json(await listDocuments(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
qualityRouter.post('/documents', async (req, res) => {
  try { res.status(201).json(await createDocument(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.put('/documents/:id', async (req, res) => {
  try { res.json(await updateDocument(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.delete('/documents/:id', async (req, res) => {
  try { await deleteDocument(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});

// Databooks
qualityRouter.get('/databooks', async (req, res) => {
  try { res.json(await listDatabooks(req.query as Record<string, string>)); } catch (e) { res.status(500).json({ error: String(e) }); }
});
qualityRouter.post('/databooks', async (req, res) => {
  try { res.status(201).json(await createDatabook(req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.put('/databooks/:id', async (req, res) => {
  try { res.json(await updateDatabook(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.delete('/databooks/:id', async (req, res) => {
  try { await deleteDatabook(req.params.id); res.status(204).send(); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.post('/databooks/:id/documents', async (req, res) => {
  try { res.status(201).json(await addDatabookDocument(req.params.id, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
qualityRouter.put('/databooks/:id/documents/:docId', async (req, res) => {
  try { res.json(await updateDatabookDocument(req.params.docId, req.body)); } catch (e) { res.status(400).json({ error: String(e) }); }
});
