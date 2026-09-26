import { removeComment } from '~~/server/services/comments';
import { userFor, input } from '~~/server/lib/access';

import { z } from 'zod';
export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(event, z.object({ commentId: z.uuid() }));
  return removeComment(id, user.id, data.commentId);
});
