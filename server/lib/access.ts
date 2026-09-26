import { createError, type H3Event, getRequestWebStream } from 'h3';
import { z } from 'zod';
import type { PoolClient } from 'pg';
import { getAuth } from './auth';
import { authHeaders } from './request-headers';
import { db } from './db';
import { canWrite, canManage } from '../../shared/schemas';
export async function userFor(event: H3Event) {
  const session = await getAuth().api.getSession({
    headers: authHeaders(event),
  });
  if (!session?.user || !session.user.emailVerified)
    throw createError({
      statusCode: 401,
      statusMessage: 'Sign in to continue',
    });
  return session.user;
}
export async function memberFor(
  workspaceId: string,
  userId: string,
  permission: 'read' | 'write' | 'manage' | 'owner' = 'read',
  client?: PoolClient,
) {
  if (!z.uuid().safeParse(workspaceId).success)
    throw createError({
      statusCode: 404,
      statusMessage: 'Workspace not found',
    });
  const connection = client ?? db();
  if (client)
    await client.query('SELECT id FROM workspaces WHERE id=$1 FOR UPDATE', [
      workspaceId,
    ]);
  const { rows } = await connection.query<{ role: string }>(
    'SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2',
    [workspaceId, userId],
  );
  const role = rows[0]?.role;
  if (!role)
    throw createError({
      statusCode: 404,
      statusMessage: 'Workspace not found',
    });
  if (
    (permission === 'write' && !canWrite(role)) ||
    (permission === 'manage' && !canManage(role)) ||
    (permission === 'owner' && role !== 'owner')
  )
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission for this action',
    });
  return role;
}
export async function input<T extends z.ZodType>(
  event: H3Event,
  schema: T,
): Promise<z.infer<T>> {
  const reader = new Response(getRequestWebStream(event)).body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2_000_000) {
          // Drain oversized chunked requests without retaining their payload.
          chunks.length = 0;
          continue;
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  if (size > 2_000_000)
    throw createError({
      statusCode: 413,
      statusMessage: 'Request is too large',
    });
  const raw = Buffer.concat(chunks).toString('utf8');
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' });
  }
  const result = schema.safeParse(body);
  if (!result.success)
    throw createError({
      statusCode: 400,
      statusMessage: 'Check the submitted fields',
      data: {
        issues: result.error.issues.map(({ path, message }) => ({
          path,
          message,
        })),
      },
    });
  return result.data;
}
export async function recordActivity(
  client: PoolClient,
  workspaceId: string,
  userId: string,
  action: string,
  detail: string,
  boardId: string | null = null,
) {
  await client.query(
    'INSERT INTO activity(workspace_id, actor_id, action, detail, board_id) VALUES ($1,$2,$3,$4,$5)',
    [workspaceId, userId, action, detail, boardId],
  );
}
