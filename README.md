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
git clone https://github.com/nayfort/trello-clone.git
cd trello-clone
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). A sample project is created on the first visit. The application runs without API keys or environment variables.

## Commands

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the development server.             |
| `npm run typecheck`    | Check TypeScript and Vue component types. |
| `npm test`             | Run the browser regression tests.         |
| `npm run build`        | Create the production build.              |
| `npm run preview`      | Preview the production build locally.     |
| `npm run format`       | Format source files with Prettier.        |
| `npm run format:check` | Check source formatting.                  |

Install Chromium before running the browser tests:

```bash
npx playwright install chromium
npm test
```

The tests cover project management, task validation and editing, drag and drop, keyboard controls, deletion confirmation, persistence and migration, storage recovery, mobile navigation, localization, and theme switching. Playwright starts the development server automatically.

GitHub Actions runs formatting, type checks, a production build, and browser tests on pushes to `main` and pull requests.

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
stores/             Project and task state transitions
types/              Shared board data models
tests/              Browser regression tests
```

## Code organization

Task creation and editing share one validated form. The Pinia store owns board mutations, while `lib/board.ts` contains shared validation and status labels. The persistence adapter validates saved data and migrates existing cookie storage. Reusable dialog primitives manage focus and keyboard interaction.
