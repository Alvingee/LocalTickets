import { useEffect, useMemo, useState } from 'react';

const columns = [
  { key: 'todo', title: 'To do' },
  { key: 'doing', title: 'Doing' },
  { key: 'done', title: 'Done' }
];

const statusLabels = Object.fromEntries(columns.map((column) => [column.key, column.title]));

const emptyStoryForm = {
  title: '',
  notes: '',
  status: 'todo'
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  return response.json();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function sortStories(a, b) {
  if ((a.order ?? 0) !== (b.order ?? 0)) {
    return (a.order ?? 0) - (b.order ?? 0);
  }

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function App() {
  const [stories, setStories] = useState([]);
  const [storyForm, setStoryForm] = useState(emptyStoryForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const editingStory = stories.find((story) => story.id === editingId) ?? null;

  async function loadStories() {
    try {
      setError('');
      const data = await request('/api/stories');
      setStories(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadStories();
  }, []);

  async function submitStory(event) {
    event.preventDefault();

    if (!storyForm.title.trim() || busy) {
      return;
    }

    setBusy(true);

    try {
      setError('');
      const created = await request('/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          title: storyForm.title.trim(),
          notes: storyForm.notes.trim(),
          status: storyForm.status
        })
      });

      setStories((prev) => [...prev, created]);
      setStoryForm(emptyStoryForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function patchStory(id, patch) {
    setBusy(true);

    try {
      setError('');
      const updated = await request(`/api/stories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });

      setStories((prev) => prev.map((story) => (story.id === id ? updated : story)));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  const storiesByStatus = useMemo(() => {
    const grouped = Object.fromEntries(columns.map((column) => [column.key, []]));

    for (const story of stories) {
      if (grouped[story.status]) {
        grouped[story.status].push(story);
      }
    }

    for (const list of Object.values(grouped)) {
      list.sort(sortStories);
    }

    return grouped;
  }, [stories]);

  function onDragStart(event, id) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  }

  async function onDrop(event, status) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    const story = stories.find((item) => item.id === id);

    if (!story || story.status === status || busy) {
      return;
    }

    await patchStory(id, { status });
  }

  async function moveOneStepRight(story) {
    const idx = columns.findIndex((column) => column.key === story.status);
    const next = columns[Math.min(columns.length - 1, idx + 1)]?.key;

    if (!next || next === story.status || busy) {
      return;
    }

    await patchStory(story.id, { status: next });
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local-first kanban</p>
          <h1>LocalTickets</h1>
          <p className="subtitle">A fast local board for tracking stories without the clutter.</p>
        </div>
      </header>

      <section className="composer panel">
        <h2>Add a story</h2>
        <form onSubmit={submitStory} className="composerForm">
          <input
            type="text"
            value={storyForm.title}
            onChange={(event) => setStoryForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="What needs to be done?"
            maxLength={120}
            required
          />
          <textarea
            value={storyForm.notes}
            onChange={(event) => setStoryForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Optional notes"
            rows={2}
          />
          <div className="row">
            <select
              value={storyForm.status}
              onChange={(event) => setStoryForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {columns.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.title}
                </option>
              ))}
            </select>
            <button type="submit" disabled={!storyForm.title.trim() || busy}>
              {busy ? 'Saving…' : 'Create story'}
            </button>
          </div>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="board" aria-label="Story board">
        {columns.map((column) => (
          <article
            key={column.key}
            className="column panel"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, column.key)}
          >
            <header className="columnHeader">
              <h3>{column.title}</h3>
              <span>{storiesByStatus[column.key].length}</span>
            </header>

            <ul className="list">
              {storiesByStatus[column.key].map((story) => (
                <li
                  key={story.id}
                  className="card"
                  draggable={!busy}
                  onDragStart={(event) => onDragStart(event, story.id)}
                >
                  <div className="row between">
                    <strong>{story.title}</strong>
                    <span className={`status status-${story.status}`}>{statusLabels[story.status]}</span>
                  </div>

                  <p className="notes">{story.notes || 'No notes yet.'}</p>

                  <footer className="cardFooter">
                    <small>Updated {formatDate(story.updatedAt)}</small>
                    <div className="row">
                      <button type="button" onClick={() => setEditingId(story.id)} disabled={busy}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOneStepRight(story)}
                        disabled={busy || story.status === 'done'}
                      >
                        Next column →
                      </button>
                    </div>
                  </footer>
                </li>
              ))}

              {!storiesByStatus[column.key].length && <li className="muted">Drop a story here.</li>}
            </ul>
          </article>
        ))}
      </section>

      {editingStory && (
        <dialog className="modal" open>
          <form
            className="modalCard"
            onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const title = `${formData.get('title') ?? ''}`.trim();

              if (!title) {
                return;
              }

              await patchStory(editingStory.id, {
                title,
                notes: `${formData.get('notes') ?? ''}`.trim(),
                status: `${formData.get('status') ?? 'todo'}`
              });

              setEditingId(null);
            }}
          >
            <h2>Edit story</h2>
            <input name="title" defaultValue={editingStory.title} maxLength={120} required />
            <textarea name="notes" defaultValue={editingStory.notes} rows={4} />
            <select name="status" defaultValue={editingStory.status}>
              {columns.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.title}
                </option>
              ))}
            </select>
            <div className="row modalActions">
              <button type="button" onClick={() => setEditingId(null)}>
                Cancel
              </button>
              <button type="submit">Save changes</button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
