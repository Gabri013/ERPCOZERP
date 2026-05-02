import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  listCrmProcesses,
  getCrmProcess,
  createCrmProcess,
  updateCrmProcess,
  changeCrmProcessStage,
  deleteCrmProcess,
  addCrmNote,
  addCrmAttachment,
  getCrmDashboard,
} from './crm-processes.service.js';

export const crmProcessesRouter = Router();
crmProcessesRouter.use(authenticate);

crmProcessesRouter.get('/dashboard', async (req, res) => {
  try {
    res.json(await getCrmDashboard());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

crmProcessesRouter.get('/', async (req, res) => {
  try {
    const { type, stage, search } = req.query as Record<string, string>;
    res.json(await listCrmProcesses({ type, stage, search }));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

crmProcessesRouter.get('/:id', async (req, res) => {
  try {
    const item = await getCrmProcess(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

crmProcessesRouter.post('/', async (req, res) => {
  try {
    res.status(201).json(await createCrmProcess(req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

crmProcessesRouter.put('/:id', async (req, res) => {
  try {
    res.json(await updateCrmProcess(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

crmProcessesRouter.patch('/:id/stage', async (req, res) => {
  try {
    res.json(await changeCrmProcessStage(req.params.id, req.body.stage));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

crmProcessesRouter.delete('/:id', async (req, res) => {
  try {
    await deleteCrmProcess(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

crmProcessesRouter.post('/:id/notes', async (req, res) => {
  try {
    res.status(201).json(await addCrmNote(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

crmProcessesRouter.post('/:id/attachments', async (req, res) => {
  try {
    res.status(201).json(await addCrmAttachment(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});
