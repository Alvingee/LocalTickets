import { useEffect, useMemo, useState } from 'react';

const columns = [
  { key: 'todo', title: 'To do' },
  { key: 'inprogress', title: 'In progress' },
  { key: 'abandoned', title: 'Abandoned' },
  { key: 'done', title: 'Done' }
];

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

function sortByOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0);
}

export function App() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  async function loadItems() {
    try {
      setError('');
      const data = await request('/api/stories');
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function createItem(kind, parentEpicId = null, status = 'todo') {
    const title = window.prompt(kind === 'epic' ? 'Epic title' : 'Story title');
    if (!title?.trim()) {
      return;
    }
    const notes = window.prompt('Notes (optional)', '') ?? '';
    try {
      setError('');
      await request('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), notes, kind, parentEpicId, status })
      });
      await loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function patchItem(id, patch) {
    try {
      setError('');
      await request(`/api/stories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      await loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  const byColumn = useMemo(() => {
    const map = Object.fromEntries(columns.map((column) => [column.key, []]));
    for (const item of items) {
      if (map[item.status]) {
        map[item.status].push(item);
      }
    }
    for (const value of Object.values(map)) {
      value.sort(sortByOrder);
    }
    return map;
  }, [items]);

  const allEpics = useMemo(() => items.filter((item) => item.kind === 'epic'), [items]);

  function columnView(columnKey) {
    const columnItems = byColumn[columnKey] || [];
    const epics = columnItems.filter((item) => item.kind === 'epic');
    const standalone = columnItems.filter((item) => item.kind !== 'epic' && !item.parentEpicId);

    return [...epics, ...standalone];
  }

  function epicChildren(epicId, columnKey) {
    return (byColumn[columnKey] || [])
      .filter((item) => item.kind === 'story' && item.parentEpicId === epicId)
      .sort(sortByOrder);
  }

  function onDragStart(event, item) {
    event.dataTransfer.setData('text/plain', item.id);
  }

  async function onDrop(event, status, parentEpicId = null) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    if (!id) {
      return;
    }

    const moved = items.find((item) => item.id === id);
    if (!moved) {
      return;
    }

    const patch = { status, parentEpicId };
    if (moved.kind === 'epic') {
      patch.parentEpicId = null;
    }

    await patchItem(id, patch);
  }

  return (
    <div className="page">
      <header>
        <h1>LocalTickets</h1>
        <p>Column board with epics and stories.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="toolbar panel">
        <button onClick={() => createItem('story')}>Create Story</button>
        <button onClick={() => createItem('epic')}>Create Epic</button>
      </section>

      <section className="board">
        {columns.map((column) => (
          <article
            key={column.key}
            className="column"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, column.key)}
          >
            <h3>{column.title}</h3>
            <ul className="list">
              {columnView(column.key).map((item) => (
                <li
                  key={item.id}
                  className={`card ${item.kind === 'epic' ? 'epic' : ''}`}
                  draggable
                  onDragStart={(event) => onDragStart(event, item)}
                >
                  <div className="row between">
                    <strong>{item.title}</strong>
                    <span className="badge">{item.kind}</span>
                  </div>
                  <p>{item.notes || 'No notes'}</p>
                  <div className="row">
                    <select
                      value={item.status}
                      onChange={(event) => patchItem(item.id, { status: event.target.value })}
                    >
                      {columns.map((nextColumn) => (
                        <option key={nextColumn.key} value={nextColumn.key}>
                          {nextColumn.title}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const notes = window.prompt('Edit notes', item.notes || '');
                        if (notes !== null) {
                          patchItem(item.id, { notes });
                        }
                      }}
                    >
                      Edit
                    </button>
                    {item.kind === 'epic' && (
                      <button onClick={() => createItem('story', item.id, item.status)}>+</button>
                    )}
                  </div>

                  {item.kind === 'epic' && (
                    <ul
                      className="childList"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => onDrop(event, item.status, item.id)}
                    >
                      {epicChildren(item.id, column.key).map((child) => (
                        <li
                          key={child.id}
                          className="card child"
                          draggable
                          onDragStart={(event) => onDragStart(event, child)}
                        >
                          <div className="row between">
                            <strong>{child.title}</strong>
                            <span className="badge">story</span>
                          </div>
                          <p>{child.notes || 'No notes'}</p>
                          <div className="row">
                            <select
                              value={child.status}
                              onChange={(event) => patchItem(child.id, { status: event.target.value })}
                            >
                              {columns.map((nextColumn) => (
                                <option key={nextColumn.key} value={nextColumn.key}>
                                  {nextColumn.title}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const notes = window.prompt('Edit notes', child.notes || '');
                                if (notes !== null) {
                                  patchItem(child.id, { notes });
                                }
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {!columnView(column.key).length && <li className="muted">No tickets.</li>}
            </ul>
          </article>
        ))}
      </section>

      {!!allEpics.length && (
        <p className="muted help">Tip: Drag a story into an epic card area to nest it.</p>
      )}
    </div>
  );
}
