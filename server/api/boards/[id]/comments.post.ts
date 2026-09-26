import { addComment } from '~~/server/services/comments';
import { userFor, input } from '~~/server/lib/access';
import { commentInput } from '~~/shared/schemas';

export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(event, commentInput);
  return addComment(id, user.id, data.taskId, data.body);
});
