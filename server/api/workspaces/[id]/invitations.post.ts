import { invite } from '~~/server/services/workspaces';
import { userFor, input } from '~~/server/lib/access';
import { inviteInput } from '~~/shared/schemas';

export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(event, inviteInput);
  return invite(id, user.id, data.email, data.role);
});
