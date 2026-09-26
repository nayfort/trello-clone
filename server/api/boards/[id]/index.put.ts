import { updateBoard } from '~~/server/services/boards';
import { userFor, input } from '~~/server/lib/access';
import { boardInput } from '~~/shared/schemas';

export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(event, boardInput);
  return updateBoard(id, user.id, data);
});
