import { listWorkspaces } from '~~/server/services/workspaces';
import { userFor } from '~~/server/lib/access';

export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';

  return listWorkspaces(user.id);
});
