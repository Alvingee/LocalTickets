import { useEffect, useMemo, useState } from 'react';

const storyStatuses = ['todo', 'doing', 'done'];

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

export function App() {
  const [stories, setStories] = useState([]);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryNotes, setNewStoryNotes] = useState('');
  const [error, setError] = useState('');

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

  async function createStory(event) {
    event.preventDefault();
    if (!newStoryTitle.trim()) {
      return;
    }
    try {
      setError('');
      await request('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ title: newStoryTitle, notes: newStoryNotes })
      });
      setNewStoryTitle('');
      setNewStoryNotes('');
      await loadStories();
    } catch (err) {
      setError(err.message);
    }
  }

  async function patchStory(storyId, patch) {
    try {
      setError('');
      await request(`/api/stories/${storyId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      await loadStories();
    } catch (err) {
      setError(err.message);
    }
  }

  const storiesByStatus = useMemo(() => {
    return Object.fromEntries(
      storyStatuses.map((status) => [
        status,
        stories
          .filter((story) => story.status === status)
          .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      ])
    );
  }, [stories]);

  return (
    <div className="page">
      <header>
        <h1>LocalTickets</h1>
        <p>A local Trello-style board backed by git-tracked JSON.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="panel addPanel">
        <h2>Add Story</h2>
        <form onSubmit={createStory} className="stack">
          <input
            value={newStoryTitle}
            onChange={(event) => setNewStoryTitle(event.target.value)}
            placeholder="What needs to get done?"
            required
          />
          <textarea
            value={newStoryNotes}
            onChange={(event) => setNewStoryNotes(event.target.value)}
            rows={2}
            placeholder="Notes (optional)"
          />
          <button type="submit">Add Card</button>
        </form>
      </section>

      <section className="board">
        {storyStatuses.map((status) => (
          <article key={status} className="column">
            <h3>{status}</h3>
            <ul className="list">
              {storiesByStatus[status].map((story) => (
                <li key={story.id} className="card">
                  <strong>{story.title}</strong>
                  <p>{story.notes || 'No notes'}</p>
                  <div className="row">
                    <select
                      value={story.status}
                      onChange={(event) => patchStory(story.id, { status: event.target.value })}
                    >
                      {storyStatuses.map((nextStatus) => (
                        <option key={nextStatus} value={nextStatus}>
                          {nextStatus}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const notes = window.prompt('Story notes', story.notes || '');
                        if (notes !== null) {
                          patchStory(story.id, { notes });
                        }
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
              {!storiesByStatus[status].length && <li className="muted">No cards.</li>}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
