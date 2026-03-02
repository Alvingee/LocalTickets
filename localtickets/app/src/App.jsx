import { useEffect, useMemo, useState } from 'react';

const epicStatuses = ['active', 'done'];
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
  const [epics, setEpics] = useState([]);
  const [selectedEpicId, setSelectedEpicId] = useState('');
  const [stories, setStories] = useState([]);
  const [epicFilter, setEpicFilter] = useState('active');
  const [error, setError] = useState('');

  const [newEpicTitle, setNewEpicTitle] = useState('');
  const [newEpicDescription, setNewEpicDescription] = useState('');
  const [newStoryTitle, setNewStoryTitle] = useState('');

  const selectedEpic = useMemo(
    () => epics.find((epic) => epic.id === selectedEpicId),
    [epics, selectedEpicId]
  );

  async function loadEpics() {
    try {
      setError('');
      const data = await request('/api/epics');
      setEpics(data);
      if (!selectedEpicId && data.length) {
        setSelectedEpicId(data[0].id);
      }
      if (selectedEpicId && !data.some((epic) => epic.id === selectedEpicId)) {
        setSelectedEpicId(data[0]?.id ?? '');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadStories(epicId) {
    if (!epicId) {
      setStories([]);
      return;
    }
    try {
      setError('');
      const data = await request(`/api/epics/${epicId}/stories`);
      setStories(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadEpics();
  }, []);

  useEffect(() => {
    loadStories(selectedEpicId);
  }, [selectedEpicId]);

  async function createEpic(event) {
    event.preventDefault();
    if (!newEpicTitle.trim()) {
      return;
    }
    try {
      setError('');
      await request('/api/epics', {
        method: 'POST',
        body: JSON.stringify({ title: newEpicTitle, description: newEpicDescription })
      });
      setNewEpicTitle('');
      setNewEpicDescription('');
      await loadEpics();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createStory(event) {
    event.preventDefault();
    if (!newStoryTitle.trim() || !selectedEpicId) {
      return;
    }
    try {
      setError('');
      await request('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ epicId: selectedEpicId, title: newStoryTitle })
      });
      setNewStoryTitle('');
      await loadStories(selectedEpicId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function patchEpic(epicId, patch) {
    try {
      setError('');
      await request(`/api/epics/${epicId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      await loadEpics();
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
      await loadStories(selectedEpicId);
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredEpics = epics.filter((epic) => epic.status === epicFilter);

  return (
    <div className="page">
      <header>
        <h1>LocalTickets</h1>
        <p>Local-first epics and stories for tiny teams.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="layout">
        <section className="panel">
          <h2>Epics</h2>
          <div className="row">
            {epicStatuses.map((status) => (
              <button
                key={status}
                className={status === epicFilter ? 'chip active' : 'chip'}
                onClick={() => setEpicFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <form onSubmit={createEpic} className="stack">
            <input
              value={newEpicTitle}
              onChange={(event) => setNewEpicTitle(event.target.value)}
              placeholder="New epic title"
              required
            />
            <textarea
              value={newEpicDescription}
              onChange={(event) => setNewEpicDescription(event.target.value)}
              rows={2}
              placeholder="Description (optional)"
            />
            <button type="submit">Add Epic</button>
          </form>

          <ul className="list">
            {filteredEpics.map((epic) => (
              <li key={epic.id} className={epic.id === selectedEpicId ? 'card selected' : 'card'}>
                <button className="titleBtn" onClick={() => setSelectedEpicId(epic.id)}>
                  {epic.title}
                </button>
                <p>{epic.description || 'No description'}</p>
                <div className="row">
                  <select
                    value={epic.status}
                    onChange={(event) => patchEpic(epic.id, { status: event.target.value })}
                  >
                    {epicStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const title = window.prompt('Epic title', epic.title);
                      if (title && title.trim()) {
                        patchEpic(epic.id, { title });
                      }
                    }}
                  >
                    Rename
                  </button>
                </div>
              </li>
            ))}
            {!filteredEpics.length && <li className="muted">No epics in this state.</li>}
          </ul>
        </section>

        <section className="panel">
          <h2>Stories {selectedEpic ? `for ${selectedEpic.title}` : ''}</h2>
          {!selectedEpic && <p className="muted">Pick an epic to manage stories.</p>}
          {selectedEpic && (
            <>
              <form onSubmit={createStory} className="row">
                <input
                  value={newStoryTitle}
                  onChange={(event) => setNewStoryTitle(event.target.value)}
                  placeholder="Quick add story"
                  required
                />
                <button type="submit">Add</button>
              </form>

              <ul className="list">
                {stories.map((story) => (
                  <li key={story.id} className="card">
                    <strong>{story.title}</strong>
                    <p>{story.notes || 'No notes'}</p>
                    <div className="row">
                      <select
                        value={story.status}
                        onChange={(event) => patchStory(story.id, { status: event.target.value })}
                      >
                        {storyStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
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
                        Edit Notes
                      </button>
                    </div>
                  </li>
                ))}
                {!stories.length && <li className="muted">No stories yet for this epic.</li>}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
