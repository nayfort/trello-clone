import { expect, test } from '@playwright/test';

test('project changes and an empty project list survive reload', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Enter project name').fill('  Release  ');
  await page.getByRole('button', { name: 'Add project', exact: true }).click();
  const row = page.getByRole('listitem').last();
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await row.getByRole('textbox').fill('Release plan');
  await row.getByRole('textbox').press('Enter');
  await page.reload();
  await expect(page.getByRole('link', { name: 'Release plan', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove', exact: true }).first().click();
  await page.getByRole('button', { name: 'Remove', exact: true }).first().click();
  await page.reload();
  await expect(page.getByPlaceholder('Enter project name')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('task validation, editing, drag and drop, and large data persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Test project', exact: true }).click();
  await page.getByRole('button', { name: 'Add task', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Name*', { exact: true }).fill('Review');
  await dialog.getByPlaceholder('Description*', { exact: true }).fill('Long description '.repeat(500));
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const card = page.locator('li[data-id]');
  await expect(card).toHaveText('Review');
  await page.reload();
  await expect(card).toHaveText('Review');
  await card.click();
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog.getByRole('textbox').first().fill('Unsaved');
  await page.keyboard.press('Escape');
  await card.click();
  await expect(dialog.getByRole('textbox')).toHaveCount(0);
  await expect(dialog.getByText('Review', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
  await dialog.getByRole('textbox').first().fill('Reviewed');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close', exact: true }).first().click();
  const target = page.locator('section').nth(1).locator('ul');
  const from = await card.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Missing drag target');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await page.waitForTimeout(400);
  await page.mouse.up();
  await expect(target.locator('li')).toHaveText('Reviewed');
  await page.reload();
  await expect(target.locator('li')).toHaveText('Reviewed');
  await card.click();
  await expect(dialog.getByText('In progress', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('existing cookie projects migrate without data loss', async ({ page, context }) => {
  const data = { projects: [{ id: 'legacy', name: 'Existing board', dashboard: [
    { status: 'TODO', tasks: [] }, { status: 'In progress', tasks: [] }, { status: 'Done', tasks: [] },
  ] }] };
  await context.addCookies([{ name: 'projects-store', value: encodeURIComponent(JSON.stringify(data)), url: 'http://127.0.0.1:3000' }]);
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Existing board' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Existing board' })).toBeVisible();
  expect((await context.cookies()).some((cookie) => cookie.name === 'projects-store')).toBe(false);
});

test('language, theme and missing project route work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Enter project name')).toBeVisible();
  await page.getByRole('button', { name: 'UK', exact: true }).click();
  await expect(page).toHaveURL(/\/uk$/);
  await expect(page.getByRole('heading', { name: 'Управління проектами' })).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  const before = await page.locator('html').getAttribute('class');
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('class', before || '');
  const after = await page.locator('html').getAttribute('class');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('class', after || '');
  await page.goto('/dashboard/missing');
  await expect(page.getByText('Project not found', { exact: true })).toBeVisible();
});
