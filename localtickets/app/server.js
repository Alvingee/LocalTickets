import express from 'express';
import {
  createEpic,
  createStory,
  initializeDataFiles,
  listEpics,
  listStoriesByEpic,
  updateEpic,
  updateStory
} from './storage.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.get('/api/epics', async (_, res, next) => {
  try {
    const epics = await listEpics();
    res.json(epics);
  } catch (error) {
    next(error);
  }
});

app.post('/api/epics', async (req, res, next) => {
  try {
    const { title, description, status } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Epic title is required.' });
    }
    const epic = await createEpic({ title: title.trim(), description, status });
    return res.status(201).json(epic);
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/epics/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'status'];
    const patch = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );
    if (patch.title !== undefined && !patch.title.trim()) {
      return res.status(400).json({ error: 'Epic title cannot be empty.' });
    }
    if (patch.title) {
      patch.title = patch.title.trim();
    }
    const epic = await updateEpic(req.params.id, patch);
    if (!epic) {
      return res.status(404).json({ error: 'Epic not found.' });
    }
    return res.json(epic);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/epics/:id/stories', async (req, res, next) => {
  try {
    const stories = await listStoriesByEpic(req.params.id);
    res.json(stories);
  } catch (error) {
    next(error);
  }
});

app.post('/api/stories', async (req, res, next) => {
  try {
    const { epicId, title, notes, status } = req.body;
    if (!epicId) {
      return res.status(400).json({ error: 'epicId is required.' });
    }
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Story title is required.' });
    }
    const story = await createStory({
      epicId,
      title: title.trim(),
      notes,
      status
    });
    return res.status(201).json(story);
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/stories/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'notes', 'status'];
    const patch = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );
    if (patch.title !== undefined && !patch.title.trim()) {
      return res.status(400).json({ error: 'Story title cannot be empty.' });
    }
    if (patch.title) {
      patch.title = patch.title.trim();
    }
    const story = await updateStory(req.params.id, patch);
    if (!story) {
      return res.status(404).json({ error: 'Story not found.' });
    }
    return res.json(story);
  } catch (error) {
    return next(error);
  }
});

app.use((error, _, res, __) => {
  console.error(error);
  res.status(500).json({ error: 'Unexpected server error.' });
});

initializeDataFiles()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LocalTickets API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize data files', error);
    process.exit(1);
  });
