# LocalTickets

A minimal, local-first Jira-like tracker for solo developers or very small teams.

## Product Goal

LocalTickets is designed for **speed and low friction**:
- Launch in your browser from your repo.
- Create **Epics** (big themes) and **Stories** (actionable work).
- Store all data as plain files in the repo so everything is git-tracked.
- Avoid complexity: no workflow engines, no sprint math, no dependency graphs.

## Core Scope (MVP)

### Entities
- **Epic**
  - `id`
  - `title`
  - `description` (optional)
  - `status` (`active` | `done`)
  - `createdAt`, `updatedAt`
- **Story**
  - `id`
  - `epicId`
  - `title`
  - `notes` (optional)
  - `status` (`todo` | `doing` | `done`)
  - `createdAt`, `updatedAt`

### Views (only a couple)
1. **Epic View**
   - List epics.
   - Create/edit/archive epic.
   - Select an epic to open its stories.
2. **Story View**
   - Show stories under one epic.
   - Add quick stories.
   - Toggle simple statuses.

## Data Model and Repo Structure

Use plain JSON files so data is easy to read and merge in git.

```txt
localtickets/
  app/                     # web UI + local server
  data/
    epics.json             # array of epics
    stories.json           # array of stories
  scripts/
    dev.sh                 # run locally
    build.sh               # optional static build
```

### Why this structure?
- `data/` is version-controlled and human-editable.
- Easy backups, diffs, and branch-based planning.
- No external DB dependency.

## Suggested Tech Stack

Keep the stack intentionally small:
- **Frontend:** React + Vite (or plain HTML/JS if you want ultra-minimal).
- **Backend:** tiny Node/Express server for file I/O.
- **Storage:** JSON files in `data/`.

If you want even less moving parts, use a single Node server that serves static UI and API endpoints.

## API Sketch (minimal)

- `GET /api/epics`
- `POST /api/epics`
- `PATCH /api/epics/:id`
- `GET /api/epics/:id/stories`
- `POST /api/stories`
- `PATCH /api/stories/:id`

No auth, no permissions, no multi-user sync in MVP.

## UX Principles

- **One-click add** for epics and stories.
- **Inline edit** for fast updates.
- Keep forms short (title first, details optional).
- Prioritize keyboard-friendly interactions.
- No mandatory fields beyond title.

## Plan of Attack

### Phase 1 — Foundation
1. Bootstrap app scaffold (`app/`, `data/`, `scripts/`).
2. Define JSON schema and sample seed data.
3. Build file-based repository layer (read/write with safe atomic writes).
4. Add minimal API routes.

### Phase 2 — MVP UI
1. Build Epic View (list + create + select).
2. Build Story View (stories for selected epic + quick add).
3. Add status toggles and lightweight edit dialogs.
4. Basic empty states and error states.

### Phase 3 — Usability Polish
1. Improve keyboard flow (enter to submit, escape to cancel).
2. Add tiny filters (`active`, `done`).
3. Improve styling for readability (still minimal).
4. Add starter docs and “how to run” commands.

### Phase 4 — Git-First Workflow Enhancements (optional)
1. Add optional script to create daily snapshot commits.
2. Add JSON formatting/lint check for clean diffs.
3. Add import/export command for portability.

## Non-Goals (for now)

- No advanced issue linking.
- No estimations, burndown, velocity charts.
- No role/permission model.
- No heavy plugin architecture.

## Definition of Done for MVP

- User can start app locally in <1 minute.
- User can create epics and stories from browser UI.
- Data persists to repo files and appears in git diffs.
- UI has only Epic and Story focused flows with minimal friction.
