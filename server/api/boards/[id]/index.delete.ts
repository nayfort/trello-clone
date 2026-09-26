import { deleteBoard } from '~~/server/services/boards';
import { userFor, input } from '~~/server/lib/access';

import { z } from 'zod';
export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(
    event,
    z.object({ version: z.number().int().positive() }),
  );
  return deleteBoard(id, user.id, data.version);
});
