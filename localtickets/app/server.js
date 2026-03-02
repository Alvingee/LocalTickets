import express from 'express';
import { createStory, initializeDataFiles, listStories, updateStory } from './storage.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.get('/api/stories', async (_, res, next) => {
  try {
    const stories = await listStories();
    res.json(stories);
  } catch (error) {
    next(error);
  }
});

app.post('/api/stories', async (req, res, next) => {
  try {
    const { title, notes, status } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Story title is required.' });
    }
    const story = await createStory({ title: title.trim(), notes, status });
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
