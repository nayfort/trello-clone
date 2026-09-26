import { importBoards } from '~~/server/services/boards';
import { userFor, input } from '~~/server/lib/access';
import { importInput } from '~~/shared/schemas';

export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(event, importInput);
  return importBoards(id, user.id, data);
});
