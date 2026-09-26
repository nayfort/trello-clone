import { transferOwnership } from '~~/server/services/workspaces';
import { userFor, input } from '~~/server/lib/access';

import { z } from 'zod';
export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(
    event,
    z.object({ userId: z.string().min(1).max(100) }),
  );
  return transferOwnership(id, user.id, data.userId);
});
