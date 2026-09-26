import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  account,
  workspace,
  board,
  origin,
  invite,
  password,
  mailLink,
} from './helpers';

test('registration, email verification and sign in', async ({
  page,
  context,
}) => {
  const email = `e2e-${crypto.randomUUID()}@example.test`;
  await page.goto('/register');
  await page.getByLabel('Name', { exact: true }).fill('New teammate');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Check your inbox');
  const link = await mailLink(context.request, email, 'Verify your email');
  await page.goto(link);
  await expect(
    page.getByRole('heading', { name: 'Your team starts here' }),
  ).toBeVisible();
  await page.getByLabel('Workspace name', { exact: true }).fill('My workspace');
  await page
    .getByRole('button', { name: 'Create workspace', exact: true })
    .last()
    .click();
  await expect(page.getByPlaceholder('Enter project name')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByPlaceholder('Enter project name')).toBeVisible();
});

test('board CRUD, task details, drag, comments, filters and persistence', async ({
  page,
  context,
}) => {
  await account(context);
  const team = await workspace(context.request);
  await board(context.request, team.id);
  await page.goto('/');
  await page.getByRole('link', { name: 'Test project', exact: true }).click();
  await page
    .getByRole('button', { name: 'Add task', exact: true })
    .first()
    .click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Add', exact: true }).last().click();
  await expect(
    dialog.getByText('Enter a task name.', { exact: true }),
  ).toBeVisible();
  await dialog.getByLabel('Name', { exact: false }).fill('Review');
  await dialog
    .getByLabel('Description', { exact: false })
    .fill('A detailed task '.repeat(400));
  await dialog.getByLabel('Priority', { exact: true }).selectOption('high');
  await dialog.getByLabel('Due date', { exact: true }).fill('2027-01-15');
  await dialog.getByLabel('Labels', { exact: true }).fill('Release, QA');
  await dialog.getByLabel('Checklist', { exact: true }).fill('Verify release');
  await dialog.getByLabel('Checklist', { exact: true }).press('Enter');
  await dialog.getByRole('button', { name: 'Add', exact: true }).last().click();
  await expect(dialog).toHaveCount(0);
  const card = page.locator('li[data-id]');
  await expect(card).toContainText('Review');
  await page.reload();
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await expect(dialog.getByText('2027-01-15', { exact: false })).toBeVisible();
  await dialog
    .getByLabel('Write a comment…', { exact: true })
    .fill('Ready for review');
  await dialog.getByRole('button', { name: 'Post comment' }).click();
  await expect(
    dialog.getByText('Ready for review', { exact: true }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog.getByLabel('Name', { exact: false }).fill('Not saved');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await expect(dialog.getByRole('textbox')).toHaveCount(1);
  await dialog
    .getByRole('button', { name: 'Close', exact: true })
    .first()
    .click();
  const target = page
    .locator('section[aria-label="In progress"] > div')
    .first()
    .locator('ul');
  const from = await card.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw Error('Missing drag targets');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 20,
  });
  await page.waitForTimeout(300);
  await page.mouse.up();
  await expect(target.locator('li')).toHaveCount(1);
  await page.reload();
  await expect(target.locator('li')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Search tasks…' }).fill('nothing');
  await expect(card).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search tasks…' }).fill('Review');
  await expect(card).toHaveCount(1);
});

test('workspace isolation, viewer restrictions, invitations and member revocation', async ({
  browser,
  context,
}) => {
  await account(context, 'Owner');
  const team = await workspace(context.request);
  const project = await board(context.request, team.id);
  const second = await browser.newContext({ baseURL: origin });
  const viewer = await account(second, 'Observer');
  expect((await second.request.get(`/api/boards/${project.id}`)).status()).toBe(
    404,
  );
  const token = await invite(context.request, team.id, viewer.email, 'viewer');
  expect(
    (
      await second.request.post('/api/invitations/accept', {
        headers: { origin },
        data: { token },
      })
    ).status(),
  ).toBe(200);
  expect((await second.request.get(`/api/boards/${project.id}`)).status()).toBe(
    200,
  );
  expect(
    (
      await second.request.post(`/api/workspaces/${team.id}/boards`, {
        headers: { origin },
        data: { name: 'Forbidden' },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await second.request.put(`/api/boards/${project.id}`, {
        headers: { origin },
        data: {
          name: project.name,
          dashboard: project.dashboard,
          version: 1,
          archived: false,
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await second.request.post('/api/invitations/accept', {
        headers: { origin },
        data: { token },
      })
    ).status(),
  ).toBe(410);
  const page = await second.newPage();
  await page.goto(`/dashboard/${project.id}`);
  await expect(page.getByText('Read-only', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add task', exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await context.request.patch(`/api/workspaces/${team.id}/members`, {
        headers: { origin },
        data: { userId: viewer.id, role: null },
      })
    ).status(),
  ).toBe(200);
  expect((await second.request.get(`/api/boards/${project.id}`)).status()).toBe(
    404,
  );
  await second.close();
});

test('concurrent writers cannot overwrite a newer board and CSRF is rejected', async ({
  context,
}) => {
  await account(context);
  const team = await workspace(context.request);
  const project = await board(context.request, team.id);
  const payload = {
    name: 'First edit',
    dashboard: project.dashboard,
    version: 1,
    archived: false,
  };
  expect(
    (
      await context.request.put(`/api/boards/${project.id}`, {
        headers: { origin: 'https://attacker.example' },
        data: payload,
      })
    ).status(),
  ).toBe(403);
  const responses = await Promise.all(
    ['First edit', 'Second edit'].map((name) =>
      context.request.put(`/api/boards/${project.id}`, {
        headers: { origin },
        data: { ...payload, name },
      }),
    ),
  );
  expect(responses.map((response) => response.status()).sort()).toEqual([
    200, 409,
  ]);
  const current = await (
    await context.request.get(`/api/boards/${project.id}`)
  ).json();
  expect(current.version).toBe(2);
  expect(
    (
      await context.request.delete(`/api/boards/${project.id}`, {
        headers: { origin },
        data: { version: 1 },
      })
    ).status(),
  ).toBe(409);
});

test('local import is idempotent, archive and restore retain tasks', async ({
  page,
  context,
}) => {
  await account(context);
  const team = await workspace(context.request);
  const legacy = {
    projects: [
      {
        id: 'legacy-1',
        name: 'Legacy project',
        dashboard: [
          { status: 'TODO', tasks: [] },
          { status: 'In progress', tasks: [] },
          { status: 'Done', tasks: [] },
        ],
      },
    ],
  };
  await page.addInitScript(
    (data) => localStorage.setItem('projects-store', JSON.stringify(data)),
    legacy,
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Import local projects', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'Legacy project', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('projects-store')!).projects.length,
    ),
  ).toBe(1);
  const result = await context.request.post(
    `/api/workspaces/${team.id}/import`,
    { headers: { origin }, data: legacy },
  );
  expect((await result.json()).count).toBe(0);
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Legacy project', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Archived', exact: true }).click();
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Legacy project', exact: true }),
  ).toBeVisible();
});

test('password recovery invalidates old sessions', async ({
  context,
  browser,
}) => {
  const owner = await account(context);
  const guest = await browser.newContext({ baseURL: origin });
  const response = await guest.request.post(
    '/api/auth/request-password-reset',
    {
      headers: { origin },
      data: { email: owner.email, redirectTo: '/reset-password' },
    },
  );
  expect(response.status()).toBe(200);
  const url = await mailLink(guest.request, owner.email, 'Reset your password');
  const redirect = await guest.request.get(url, { maxRedirects: 0 });
  const token = new URL(redirect.headers().location, origin).searchParams.get(
    'token',
  );
  expect(token).toBeTruthy();
  expect(
    (
      await guest.request.post('/api/auth/reset-password', {
        headers: { origin },
        data: { token, newPassword: password + '-new' },
      })
    ).status(),
  ).toBe(200);
  expect(
    await (await context.request.get('/api/auth/get-session')).json(),
  ).toBeNull();
  expect(
    (
      await guest.request.post('/api/auth/sign-in/email', {
        headers: { origin },
        data: { email: owner.email, password },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await guest.request.post('/api/auth/sign-in/email', {
        headers: { origin },
        data: { email: owner.email, password: password + '-new' },
      })
    ).status(),
  ).toBe(200);
  await guest.close();
});

test('mobile localization, dark mode and accessibility', async ({
  page,
  context,
}) => {
  await account(context);
  const team = await workspace(context.request);
  await board(context.request, team.id);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'UK', exact: true })
    .click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('heading', { name: 'Управління проектами' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Відкрити навігацію' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Тема', exact: true })
    .click();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  const darkResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(darkResults.violations.map((item) => item.id)).toEqual([]);
});

test('ownership transfer, leaving and workspace deletion enforce permissions', async ({
  context,
  browser,
}) => {
  const owner = await account(context, 'Owner');
  const team = await workspace(context.request);
  const project = await board(context.request, team.id);
  const other = await browser.newContext({ baseURL: origin });
  const member = await account(other, 'Successor');
  const token = await invite(context.request, team.id, member.email);
  expect(
    (
      await other.request.post('/api/invitations/accept', {
        headers: { origin },
        data: { token },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await context.request.post(`/api/workspaces/${team.id}/leave`, {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await other.request.post(`/api/workspaces/${team.id}/transfer`, {
        headers: { origin },
        data: { userId: owner.id },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.post(`/api/workspaces/${team.id}/transfer`, {
        headers: { origin },
        data: { userId: member.id },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await context.request.delete(`/api/workspaces/${team.id}`, {
        headers: { origin },
        data: { name: team.name },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.post(`/api/workspaces/${team.id}/leave`, {
        headers: { origin },
        data: {},
      })
    ).status(),
  ).toBe(200);
  expect(
    (await context.request.get(`/api/boards/${project.id}`)).status(),
  ).toBe(404);
  expect(
    (
      await other.request.delete(`/api/workspaces/${team.id}`, {
        headers: { origin },
        data: { name: 'Wrong name' },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await other.request.delete(`/api/workspaces/${team.id}`, {
        headers: { origin },
        data: { name: team.name },
      })
    ).status(),
  ).toBe(200);
  expect((await other.request.get(`/api/boards/${project.id}`)).status()).toBe(
    404,
  );
  await other.close();
});

test('task edits, keyboard status changes and confirmed deletion persist', async ({
  page,
  context,
}) => {
  await account(context);
  const team = await workspace(context.request);
  const project = await board(context.request, team.id);
  const task = {
    id: 'task-1',
    name: 'Original task',
    description: 'Task description',
    status: 'TODO',
    performer: '',
    responsiblePerson: '',
    priority: 'medium',
    dueDate: '',
    labels: [],
    checklist: [],
  };
  project.dashboard[0].tasks.push(task);
  expect(
    (
      await context.request.put(`/api/boards/${project.id}`, {
        headers: { origin },
        data: {
          name: project.name,
          dashboard: project.dashboard,
          version: 1,
          archived: false,
        },
      })
    ).status(),
  ).toBe(200);
  await page.goto(`/dashboard/${project.id}`);
  await page
    .getByRole('button', { name: 'Original task', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog.getByLabel('Name', { exact: false }).fill('Updated task');
  await dialog.getByLabel('Status', { exact: true }).selectOption('Done');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await expect(page.locator('section[aria-label="Done"]')).toContainText(
    'Updated task',
  );
  await page.getByRole('button', { name: 'Updated task', exact: true }).click();
  await dialog.getByRole('button', { name: 'Remove', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Delete task?', exact: true })
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await page.reload();
  await expect(page.locator('li[data-id]')).toHaveCount(0);
});

test('a concurrent task move preserves the open draft and unrelated edits', async ({
  page,
  context,
}) => {
  await account(context);
  const team = await workspace(context.request);
  const project = await board(context.request, team.id);
  const task = {
    id: 'conflict-task',
    name: 'Draft task',
    description: 'Original description',
    status: 'TODO',
    performer: '',
    responsiblePerson: '',
    priority: 'medium',
    dueDate: '',
    labels: [],
    checklist: [],
  };
  project.dashboard[0].tasks.push(task);
  await context.request.put(`/api/boards/${project.id}`, {
    headers: { origin },
    data: {
      name: project.name,
      dashboard: project.dashboard,
      version: 1,
      archived: false,
    },
  });
  await page.goto(`/dashboard/${project.id}`);
  await page.getByRole('button', { name: 'Draft task', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog
    .getByLabel('Description', { exact: false })
    .fill('My unsaved draft');
  project.dashboard[0].tasks = [];
  project.dashboard[1].tasks.push({ ...task, status: 'In progress' });
  expect(
    (
      await context.request.put(`/api/boards/${project.id}`, {
        headers: { origin },
        data: {
          name: 'Renamed remotely',
          dashboard: project.dashboard,
          version: 2,
          archived: false,
        },
      })
    ).status(),
  ).toBe(200);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog.getByLabel('Description', { exact: false })).toHaveValue(
    'My unsaved draft',
  );
  await expect(
    page.getByRole('alert').filter({ hasText: 'Your draft is still open' }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Renamed remotely', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Draft task', exact: true }).click();
  await expect(
    dialog.getByText('My unsaved draft', { exact: true }),
  ).toBeVisible();
});

test('anonymous routes and malformed requests fail safely', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(
    page.getByRole('heading', { name: 'Sign in', exact: true }),
  ).toBeVisible();
  expect((await context.request.get('/api/workspaces')).status()).toBe(401);
  await account(context);
  const team = await workspace(context.request);
  const project = await board(context.request, team.id);
  expect(
    (
      await context.request.get(
        '/api/boards/------------------------------------',
      )
    ).status(),
  ).toBe(404);
  expect(
    (await context.request.get(`/api/boards/${project.id}/comments`)).status(),
  ).toBe(400);
  expect(
    (
      await context.request.post('/api/workspaces', {
        headers: { origin, 'content-type': 'application/json' },
        data: '{bad json',
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await context.request.post('/api/workspaces', {
        headers: { origin },
        data: { name: 'x'.repeat(2_000_001) },
      })
    ).status(),
  ).toBe(413);
});

test('new teammates return to their invitation after registering and verifying email', async ({
  context,
  browser,
}) => {
  await account(context, 'Owner');
  const team = await workspace(context.request);
  const email = `e2e-${crypto.randomUUID()}@example.test`;
  const token = await invite(context.request, team.id, email);
  const newcomer = await browser.newContext({ baseURL: origin });
  const page = await newcomer.newPage();
  await page.goto(`/invite?token=${token}`);
  await page.getByRole('link', { name: 'Create account', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('New colleague');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Check your inbox');
  await page.goto(await mailLink(newcomer.request, email, 'Verify your email'));
  await expect(
    page.getByRole('button', { name: 'Accept invitation', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Accept invitation', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Projects management', exact: true }),
  ).toBeVisible();
  expect(
    (await (await newcomer.request.get('/api/workspaces')).json())[0].id,
  ).toBe(team.id);
  await newcomer.close();
});
