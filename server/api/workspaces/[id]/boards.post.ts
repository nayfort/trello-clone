import { createBoard } from '~~/server/services/boards';
import { userFor, input } from '~~/server/lib/access';
import { nameInput } from '~~/shared/schemas';

export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(event, nameInput);
  return createBoard(id, user.id, data.name);
});
