import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const storiesFile = path.join(dataDir, 'stories.json');

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

export async function listStories() {
  return readJson(storiesFile);
}

export async function createStory(input) {
  const stories = await readJson(storiesFile);
  const timestamp = now();
  const story = {
    id: randomUUID(),
    title: input.title,
    notes: input.notes ?? '',
    status: input.status ?? 'todo',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  stories.push(story);
  await writeJsonAtomic(storiesFile, stories);
  return story;
}

export async function updateStory(id, patch) {
  const stories = await readJson(storiesFile);
  const index = stories.findIndex((story) => story.id === id);
  if (index === -1) {
    return null;
  }
  stories[index] = {
    ...stories[index],
    ...patch,
    updatedAt: now()
  };
  await writeJsonAtomic(storiesFile, stories);
  return stories[index];
}

export async function initializeDataFiles() {
  await ensureFile(storiesFile);
}
