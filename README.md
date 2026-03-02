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
  localtickets/            # the ONE folder users copy into their own repo
    app/                   # web UI + local server
    data/
      epics.json           # array of epics
      stories.json         # array of stories
    package.json
  setup-localtickets.sh    # the ONE setup/launch helper users copy
```

### Why this structure?
- `localtickets/` is self-contained and portable.
- `data/` is version-controlled and human-editable.
- Easy backups, diffs, and branch-based planning.
- No external DB dependency.

## Decided Tech Stack

This project uses a deliberately small JavaScript stack:
- **Runtime:** Node.js 20+
- **Frontend:** React + Vite
- **Backend:** Express (same Node project)
- **Storage:** JSON files in `data/`

This keeps setup simple and supports the local-first goal (no external database and never online-hosted for MVP).

## How a New User Should Use LocalTickets

The key idea is: **LocalTickets is always local-first and offline-capable**, not a hosted service. Tickets live in your repo so they appear directly in git history.

### Simple install model (copy one folder + one file)

A user should only need to copy:
1. `localtickets/` folder (contains app + data + package metadata).
2. `setup-localtickets.sh` (single helper script).

After copying those into their project root, they run one command:

```bash
./setup-localtickets.sh
```

The script should do the easy path automatically:
- verify Node/npm versions,
- run `npm install` inside `localtickets/` if needed,
- create `localtickets/data/*.json` if missing,
- launch the app and print the browser URL.

### Recommended user flow (when app is finished)

1. Create or clone your own project repo.
2. Copy in `localtickets/` + `setup-localtickets.sh`.
3. Run `./setup-localtickets.sh`.
4. Track epics/stories in browser.
5. Commit code + ticket JSON changes together.

That means “run locally” is the **actual product workflow**, not a developer-only setup trick.

### Why local-first is the default plan

- No account/signup friction.
- No hosted database to configure.
- No cloud dependency (works as an always-local solution).
- Tickets naturally versioned with your code.
- Branching works for planning (feature branches include ticket state).

## Release and Onboarding Plan

To make onboarding extremely easy, package LocalTickets as a portable drop-in bundle.

### Practical rollout steps

1. Ship `localtickets/` as a self-contained folder.
2. Ship `setup-localtickets.sh` at repo root as the only user-facing command entry point.
3. Make `setup-localtickets.sh` idempotent (safe to rerun anytime).
4. Add seed JSON data so first launch has example content.
5. Keep this repo as source-of-truth and publish tagged releases users can download and copy from.

## Run Locally

> Current repository status: this repo currently contains the product specification only. Use the commands below once the scaffold is added.

### End-user run path (target experience)

```bash
./setup-localtickets.sh
```

That command is intended to handle install + initialize + launch in one step.

### Manual fallback (if needed)

1. Install prerequisites:
   - Node.js 20+
   - npm 10+
2. Clone and enter the repo:

```bash
git clone <your-repo-url> LocalTickets
cd LocalTickets/localtickets/app
npm install
npm run dev
```

3. Open the URL shown in terminal (typically `http://localhost:5173`).

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
