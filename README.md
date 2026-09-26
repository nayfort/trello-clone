# Trello Clone

A collaborative Kanban application built with Nuxt, Vue and TypeScript. Teams organize projects into familiar **TODO**, **In progress** and **Done** columns, with authenticated accounts and persistent PostgreSQL storage.

## Features

- Email registration, verification, sign-in and password recovery.
- Multiple workspaces, email invitations and owner, administrator, member and viewer roles.
- Workspace ownership transfer, member management and confirmed workspace deletion.
- Project creation, renaming, archival, restoration and deletion.
- Drag-and-drop task ordering, keyboard-accessible editing and status changes.
- Task descriptions, priorities, assignees, responsible people, due dates, labels and checklists.
- Task comments, workspace activity, project search and task filters.
- Version-checked updates that prevent concurrent edits from silently overwriting each other.
- JSON export and idempotent import, including projects from the previous browser-storage version.
- Responsive navigation, English and Ukrainian translations, and light and dark themes.

## Local development

Prerequisites: **Node.js 22.12+**, npm and Docker Compose.

```bash
git clone https://github.com/nayfort/trello-clone.git
cd trello-clone
npm ci
npm run setup
npm run services:up
npm run db:migrate
npm run dev
```

Open [127.0.0.1:3000](http://127.0.0.1:3000), create an account and follow the verification link in [Mailpit](http://127.0.0.1:8029). Mailpit captures local verification, recovery and invitation emails. After verification, create a workspace and invite teammates from **Team**.

`npm run setup` creates `.env` with a unique authentication secret and preserves an existing file. PostgreSQL data lives in a Docker volume; `npm run services:stop` stops the containers without deleting that data.

## Configuration

| Variable                     | Purpose                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection URL.                                                                    |
| `BETTER_AUTH_URL`            | Application origin, including the scheme and port. Use the public HTTPS origin in production. |
| `BETTER_AUTH_SECRET`         | Random authentication secret of at least 32 characters. Keep it stable across deployments.    |
| `SMTP_HOST`, `SMTP_PORT`     | SMTP server and port.                                                                         |
| `SMTP_SECURE`                | `true` for implicit TLS, normally on port 465; `false` for STARTTLS on port 587.              |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials, when required.                                                              |
| `MAIL_FROM`                  | Sender name and email address.                                                                |
| `TRUST_PROXY`                | Set to `true` only behind a controlled reverse proxy that replaces `X-Forwarded-For`.         |
| `HOST`, `PORT`               | Production HTTP listener address and port.                                                    |

Use the same origin in the browser and `BETTER_AUTH_URL`. Keep environment files and database backups outside version control.

## Commands

| Command                | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the development server.                             |
| `npm run db:migrate`   | Apply authentication and application database migrations. |
| `npm run typecheck`    | Check TypeScript and Vue component types.                 |
| `npm run test:unit`    | Test validation and permission rules.                     |
| `npm run test:e2e`     | Build and test the production application in Chromium.    |
| `npm test`             | Run unit and end-to-end tests.                            |
| `npm run build`        | Build the standalone Nitro server.                        |
| `npm run format`       | Format source files.                                      |
| `npm run format:check` | Check formatting.                                         |

Install the test browser once:

```bash
npx playwright install chromium
npm test
```

End-to-end tests use a separate database named after the configured database with an `_e2e` suffix and run the application on port **3100**. The local database user needs permission to create that database. Start the PostgreSQL and Mailpit services before testing. Each test creates its own accounts and workspace fixtures.

The suite exercises real HTTP handlers, PostgreSQL transactions and captured email links, alongside UI interactions and axe accessibility checks. GitHub Actions runs formatting, type checks, unit tests and browser tests against PostgreSQL and Mailpit services.

## Production

Build, apply migrations and start the server with environment variables supplied by your host:

```bash
npm ci
npm run build
node node_modules/tsx/dist/cli.mjs scripts/migrate.ts
node .output/server/index.mjs
```

`GET /api/health` checks database connectivity. Apply migrations once per release before serving traffic. Migration execution uses a PostgreSQL advisory lock and tracks completed application migrations.

For a server running Docker Compose, configure a separate environment file with the variables above and a strong URL-safe `POSTGRES_PASSWORD`, then run:

```bash
docker compose --env-file /secure/trello.env -p trello-production \
  -f compose.production.yaml up --build -d
```

The production configuration starts PostgreSQL, runs migrations, then starts the application as an unprivileged user. The HTTP port binds to `127.0.0.1:3000`; place a TLS reverse proxy in front of it. Configure an authenticated SMTP service and a verified sender address. Schedule PostgreSQL backups and verify restoration as part of your deployment operations.

## Architecture

```text
components/shared/  Application forms, boards, tasks and navigation
components/ui/      Reusable accessible UI primitives
i18n/locales/       English and Ukrainian translations
middleware/         Page authentication
pages/              Account, workspace and board screens
shared/             Server input schemas and role rules
stores/             Client state and versioned board mutations
server/api/         HTTP route handlers
server/lib/         Authentication, database, email and access helpers
server/services/    Transactional workspace, board and comment operations
migrations/         Versioned PostgreSQL schema changes
scripts/            Environment setup, migrations and test server
tests/unit/         Schema and permission tests
tests/e2e/          Browser and API integration tests
```

Better Auth manages credentials, verification and sessions. Server handlers authorize every workspace operation. Board content is a validated JSONB document with an optimistic version counter, so moves between columns commit atomically. Membership changes and board mutations serialize within a workspace transaction. Comments, invitations, membership and activity are relational records with foreign keys.

The Pinia store updates after successful writes. Active views refresh in the background; open editors retain their drafts. A conflicting update returns HTTP 409 and refreshes the stored board, allowing the user to review and reapply their draft. Imported browser data is copied into the selected workspace and remains intact in local storage.
