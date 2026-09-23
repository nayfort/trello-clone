# Trello Clone

A Kanban task manager built with Nuxt 3, Vue 3, and TypeScript. Organize projects into boards, move tasks through their workflow, and manage task details in a responsive interface.

## Features

- Create, rename, and delete projects.
- Track tasks across **TODO**, **In progress**, and **Done** columns.
- Drag cards between columns and reorder tasks within a column.
- Create, edit, and delete tasks with descriptions, priorities, performers, and responsible people.
- Keep projects and tasks in browser local storage across visits.
- Switch between English and Ukrainian.
- Choose light or dark mode.

## Getting started

Use Node.js **22.12 or later** and npm.

```bash
git clone https://github.com/nayfort/clone-trello.git
cd clone-trello
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). A sample project is created on the first visit. The application runs without API keys or environment variables.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run typecheck` | Check TypeScript and Vue component types. |
| `npm test` | Run the browser regression tests. |
| `npm run build` | Create the production build. |
| `npm run preview` | Preview the production build locally. |

Install Chromium before running the browser tests:

```bash
npx playwright install chromium
npm test
```

The tests cover project management, task validation and editing, drag and drop, persistence, migration of existing data, language selection, and theme switching. Playwright starts the development server automatically.

## Production

```bash
npm run build
node .output/server/index.mjs
```

The generated Nitro server listens on port `3000` by default. Set `PORT` and `HOST` to configure its address.

## Technology

- **Nuxt 3 / Vue 3** — application framework and routing.
- **TypeScript** — typed components and data models.
- **Pinia** — project and task state, with persisted storage.
- **Tailwind CSS / shadcn-vue / Radix Vue** — styling and UI primitives.
- **Vue Draggable** — task sorting and movement between columns.
- **Nuxt i18n / Color Mode** — localization and appearance settings.
- **Playwright** — browser regression testing.

## Project structure

```text
assets/css/          Global styles and theme variables
components/shared/  Project, board, task, and navigation components
components/ui/      Reusable UI primitives
i18n/locales/       English and Ukrainian translations
layouts/            Application layout
lib/                Shared constants, storage, and utilities
pages/              Project list and board routes
public/             Static assets
stores/             Pinia store and task data models
tests/              Browser regression tests
```
