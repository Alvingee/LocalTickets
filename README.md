# LocalTickets

A minimal, local-first Trello-style tracker for solo developers or tiny teams.

## Product Goal

LocalTickets is designed for **speed and low friction**:
- Launch in your browser from your repo.
- Create and move **stories/cards** across a simple board.
- Store all data as plain files in the repo so everything is git-tracked.
- Avoid complexity: no epics, no sprints, no heavy workflow rules.

## Core Scope (MVP)

### Entity
- **Story**
  - `id`
  - `title`
  - `notes` (optional)
  - `status` (`todo` | `doing` | `done`)
  - `createdAt`, `updatedAt`

### View
1. **Board View**
   - Three columns: `todo`, `doing`, `done`.
   - Quick add card.
   - Edit notes.
   - Move cards between columns.

## Data Model and Repo Structure

```txt
localtickets/
  localtickets/
    app/
    data/
      stories.json
    package.json
  setup-localtickets.sh
```

## Run Locally

```bash
./setup-localtickets.sh
./run-localtickets.sh
```

`setup-localtickets.sh` is intended for one-time setup. It verifies Node.js/npm, creates data files, and installs dependencies.
`run-localtickets.sh` launches the app for daily use.

## API (MVP)

- `GET /api/stories`
- `POST /api/stories`
- `PATCH /api/stories/:id`

No auth, no permissions, no multi-user sync in MVP.
