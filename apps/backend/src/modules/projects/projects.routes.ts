import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectTask,
  updateProjectTask,
  deleteProjectTask,
  addTimeEntry,
  addCostEntry,
  addProjectNote,
  getProjectStats,
} from './projects.service.js';

export const projectsRouter = Router();
projectsRouter.use(authenticate);

projectsRouter.get('/stats', async (req, res) => {
  try {
    res.json(await getProjectStats());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

projectsRouter.get('/', async (req, res) => {
  try {
    const { status, search } = req.query as Record<string, string>;
    res.json(await listProjects({ status, search }));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

projectsRouter.get('/:id', async (req, res) => {
  try {
    const item = await getProject(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

projectsRouter.post('/', async (req, res) => {
  try {
    res.status(201).json(await createProject(req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

projectsRouter.put('/:id', async (req, res) => {
  try {
    res.json(await updateProject(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

projectsRouter.delete('/:id', async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

projectsRouter.post('/:id/tasks', async (req, res) => {
  try {
    res.status(201).json(await addProjectTask(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

projectsRouter.put('/:id/tasks/:taskId', async (req, res) => {
  try {
    res.json(await updateProjectTask(req.params.taskId, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

projectsRouter.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    await deleteProjectTask(req.params.taskId);
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

projectsRouter.post('/:id/time-entries', async (req, res) => {
  try {
    res.status(201).json(await addTimeEntry(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

projectsRouter.post('/:id/cost-entries', async (req, res) => {
  try {
    res.status(201).json(await addCostEntry(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

projectsRouter.post('/:id/notes', async (req, res) => {
  try {
    res.status(201).json(await addProjectNote(req.params.id, req.body));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});
