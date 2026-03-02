import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const epicsFile = path.join(dataDir, 'epics.json');
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

export async function listEpics() {
  return readJson(epicsFile);
}

export async function createEpic(input) {
  const epics = await readJson(epicsFile);
  const timestamp = now();
  const epic = {
    id: randomUUID(),
    title: input.title,
    description: input.description ?? '',
    status: input.status ?? 'active',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  epics.push(epic);
  await writeJsonAtomic(epicsFile, epics);
  return epic;
}

export async function updateEpic(id, patch) {
  const epics = await readJson(epicsFile);
  const index = epics.findIndex((epic) => epic.id === id);
  if (index === -1) {
    return null;
  }
  epics[index] = {
    ...epics[index],
    ...patch,
    updatedAt: now()
  };
  await writeJsonAtomic(epicsFile, epics);
  return epics[index];
}

export async function listStoriesByEpic(epicId) {
  const stories = await readJson(storiesFile);
  return stories.filter((story) => story.epicId === epicId);
}

export async function createStory(input) {
  const stories = await readJson(storiesFile);
  const timestamp = now();
  const story = {
    id: randomUUID(),
    epicId: input.epicId,
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
  await ensureFile(epicsFile);
  await ensureFile(storiesFile);
}
