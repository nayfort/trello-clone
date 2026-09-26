import { acceptInvite } from '~~/server/services/workspaces';
import { userFor, input } from '~~/server/lib/access';

import { z } from 'zod';
export default defineEventHandler(async (event) => {
  const user = await userFor(event);
  const data = await input(
    event,
    z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }),
  );
  return acceptInvite(data.token, user);
});
