import { revokeInvite } from '~~/server/services/workspaces';
import { userFor, input } from '~~/server/lib/access';

import { z } from 'zod';
export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const id = getRouterParam(event, 'id') ?? '';
  const data = await input(event, z.object({ invitationId: z.uuid() }));
  return revokeInvite(id, user.id, data.invitationId);
});
