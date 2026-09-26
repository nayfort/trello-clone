import { listComments } from '~~/server/services/comments';
import { userFor } from '~~/server/lib/access';

import { z } from 'zod';
export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const parsed = z.string().min(1).max(100).safeParse(getQuery(event).taskId);
  if (!parsed.success)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid task identifier',
    });
  const taskId = parsed.data;
  return listComments(id, user.id, taskId);
});
