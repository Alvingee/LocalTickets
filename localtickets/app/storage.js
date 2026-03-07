import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const storiesFile = path.join(dataDir, 'stories.json');

const validStatuses = ['todo', 'doing', 'done'];

async function ensureFile(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, '[]\n', 'utf8');
  }
}

async function readJson(filePath) {
  await ensureFile(filePath);
  const raw = await fs.readFile(filePath, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
}

async function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(tmp, payload, 'utf8');
  await fs.rename(tmp, filePath);
}

const now = () => new Date().toISOString();

function normalizeStatus(status) {
  if (status === 'inprogress') {
    return 'doing';
  }

  if (status === 'abandoned') {
    return 'todo';
  }

  return validStatuses.includes(status) ? status : 'todo';
}

function normalizeStory(item, fallbackOrder = 0) {
  return {
    id: item.id ?? randomUUID(),
    title: item.title ?? 'Untitled',
    notes: item.notes ?? '',
    status: normalizeStatus(item.status),
    order: Number.isFinite(item.order) ? item.order : fallbackOrder,
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now()
  };
}

async function readStories() {
  const stories = await readJson(storiesFile);
  const normalized = stories.map((story, index) => normalizeStory(story, index));

  if (JSON.stringify(stories) !== JSON.stringify(normalized)) {
    await writeJsonAtomic(storiesFile, normalized);
  }

  return normalized;
}

export async function listStories() {
  return readStories();
}

export async function createStory(input) {
  const stories = await readStories();
  const timestamp = now();
  const maxOrder = stories.reduce((max, story) => Math.max(max, story.order ?? 0), 0);
  const story = {
    id: randomUUID(),
    title: input.title,
    notes: input.notes ?? '',
    status: normalizeStatus(input.status),
    order: maxOrder + 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  stories.push(story);
  await writeJsonAtomic(storiesFile, stories);
  return story;
}

export async function updateStory(id, patch) {
  const stories = await readStories();
  const index = stories.findIndex((story) => story.id === id);

  if (index === -1) {
    return null;
  }

  stories[index] = {
    ...stories[index],
    ...patch,
    status: patch.status ? normalizeStatus(patch.status) : stories[index].status,
    updatedAt: now()
  };

  await writeJsonAtomic(storiesFile, stories);
  return stories[index];
}

export async function initializeDataFiles() {
  await ensureFile(storiesFile);
  await readStories();
}

export { validStatuses };
