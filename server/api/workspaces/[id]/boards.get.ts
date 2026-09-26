import { listBoards } from '~~/server/services/boards';
import { userFor } from '~~/server/lib/access';

export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';

  return listBoards(id, user.id);
});
