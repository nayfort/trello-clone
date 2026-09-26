import {
  expect,
  type BrowserContext,
  type APIRequestContext,
} from '@playwright/test';
export const origin = 'http://127.0.0.1:3100';
export const password = 'A-strong-test-password-748193';
export async function mailLink(
  request: APIRequestContext,
  email: string,
  subject: string,
) {
  let link = '';
  await expect
    .poll(
      async () => {
        const list = await (
          await request.get('http://127.0.0.1:8029/api/v1/messages')
        ).json();
        const message = list.messages.find(
          (item: { ID: string; Subject: string; To: { Address: string }[] }) =>
            item.Subject === subject &&
            item.To.some((to: { Address: string }) => to.Address === email),
        );
        if (!message) return false;
        const body = await (
          await request.get(
            `http://127.0.0.1:8029/api/v1/message/${message.ID}`,
          )
        ).json();
        link = body.Text.match(/http:\/\/127\.0\.0\.1:3100\/[^\s]+/)?.[0] ?? '';
        return Boolean(link);
      },
      { timeout: 15000 },
    )
    .toBe(true);
  return link;
}
export async function account(context: BrowserContext, name = 'Teammate') {
  const email = `e2e-${crypto.randomUUID()}@example.test`;
  const response = await context.request.post('/api/auth/sign-up/email', {
    headers: { origin },
    data: { name, email, password, callbackURL: '/' },
  });
  expect(response.status(), await response.text()).toBe(200);
  const link = await mailLink(context.request, email, 'Verify your email');
  const verified = await context.request.get(link, { maxRedirects: 0 });
  expect([200, 302]).toContain(verified.status());
  const session = await (
    await context.request.get('/api/auth/get-session')
  ).json();
  expect(session.user.email).toBe(email);
  return { email, id: session.user.id as string, name };
}
export async function workspace(
  request: APIRequestContext,
  name = 'Team workspace',
) {
  const response = await request.post('/api/workspaces', {
    headers: { origin },
    data: { name },
  });
  expect(response.status(), await response.text()).toBe(200);
  return await response.json();
}
export async function board(
  request: APIRequestContext,
  workspaceId: string,
  name = 'Test project',
) {
  const response = await request.post(`/api/workspaces/${workspaceId}/boards`, {
    headers: { origin },
    data: { name },
  });
  expect(response.status(), await response.text()).toBe(200);
  return await response.json();
}
export async function invite(
  request: APIRequestContext,
  workspaceId: string,
  email: string,
  role = 'member',
) {
  const response = await request.post(
    `/api/workspaces/${workspaceId}/invitations`,
    { headers: { origin }, data: { email, role } },
  );
  expect(response.status(), await response.text()).toBe(200);
  const link = await mailLink(
    request,
    email,
    'Join Team workspace on Trello Clone',
  );
  return new URL(link).searchParams.get('token');
}
