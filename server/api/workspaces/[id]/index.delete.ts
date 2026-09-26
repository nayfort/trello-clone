import { deleteWorkspace } from '~~/server/services/workspaces';
import { userFor, input } from '~~/server/lib/access';
import { nameInput } from '~~/shared/schemas';
export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const data = await input(event, nameInput);
  return deleteWorkspace(getRouterParam(event, 'id') ?? '', user.id, data.name);
});
