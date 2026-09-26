import { createWorkspace } from '~~/server/services/workspaces';
import { userFor, input } from '~~/server/lib/access';
import { nameInput } from '~~/shared/schemas';

export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(event, nameInput);
  return createWorkspace(user.id, data.name);
});
