import { randomUUID } from 'node:crypto';
import { createError } from 'h3';
import type { PoolClient } from 'pg';
import { db, transaction } from '../lib/db';
import { memberFor, recordActivity } from '../lib/access';
import { boardInput, importInput } from '../../shared/schemas';
import { sectionStatuses, type Project } from '../../types/board';
import { z } from 'zod';
const columns =
  'id, workspace_id AS "workspaceId", name, dashboard, version, archived, updated_at AS "updatedAt"';
export async function getBoard(
  id: string,
  userId: string,
  client?: PoolClient,
  permission: 'read' | 'write' | 'manage' = 'read',
) {
  if (!z.uuid().safeParse(id).success)
    throw createError({ statusCode: 404, statusMessage: 'Board not found' });
  const { rows } = await (client ?? db()).query<Project>(
    `SELECT ${columns} FROM boards WHERE id=$1`,
    [id],
  );
  const board = rows[0];
  if (!board)
    throw createError({ statusCode: 404, statusMessage: 'Board not found' });
  await memberFor(board.workspaceId, userId, permission, client);
  if (client) {
    const current = (
      await client.query<Project>(`SELECT ${columns} FROM boards WHERE id=$1`, [
        id,
      ])
    ).rows[0];
    if (!current)
      throw createError({ statusCode: 404, statusMessage: 'Board not found' });
    return current;
  }
  return board;
}
export async function listBoards(workspaceId: string, userId: string) {
  await memberFor(workspaceId, userId);
  return (
    await db().query<Project>(
      `SELECT ${columns} FROM boards WHERE workspace_id=$1 ORDER BY created_at`,
      [workspaceId],
    )
  ).rows;
}
export async function createBoard(
  workspaceId: string,
  userId: string,
  name: string,
) {
  return transaction(async (client) => {
    await memberFor(workspaceId, userId, 'write', client);
    const { rows } = await client.query<Project>(
      `INSERT INTO boards(id,workspace_id,name,dashboard) VALUES ($1,$2,$3,$4) RETURNING ${columns}`,
      [
        randomUUID(),
        workspaceId,
        name,
        JSON.stringify(
          sectionStatuses.map((status) => ({ status, tasks: [] })),
        ),
      ],
    );
    await recordActivity(
      client,
      workspaceId,
      userId,
      'board.created',
      name,
      rows[0].id,
    );
    return rows[0];
  });
}
export async function updateBoard(
  id: string,
  userId: string,
  data: z.infer<typeof boardInput>,
) {
  return transaction(async (client) => {
    const existing = await getBoard(id, userId, client, 'write');
    if (existing.archived && data.archived)
      throw createError({
        statusCode: 409,
        statusMessage: 'Restore this board before editing',
      });
    const members = new Set(
      (
        await client.query<{ user_id: string }>(
          'SELECT user_id FROM memberships WHERE workspace_id=$1',
          [existing.workspaceId],
        )
      ).rows.map((row) => row.user_id),
    );
    for (const section of data.dashboard)
      for (const task of section.tasks) {
        if (
          [task.performer, task.responsiblePerson].some(
            (id) => id && !members.has(id),
          )
        )
          throw createError({
            statusCode: 400,
            statusMessage: 'Choose a current workspace member',
          });
      }
    const { rows } = await client.query<Project>(
      `UPDATE boards SET name=$2,dashboard=$3,archived=$4,version=version+1,updated_at=now() WHERE id=$1 AND version=$5 RETURNING ${columns}`,
      [
        id,
        data.name,
        JSON.stringify(data.dashboard),
        data.archived,
        data.version,
      ],
    );
    if (!rows.length)
      throw createError({
        statusCode: 409,
        statusMessage:
          'This board changed. Refresh and apply your changes again.',
      });
    const ids = data.dashboard.flatMap((section) =>
      section.tasks.map((task) => task.id),
    );
    await client.query(
      'DELETE FROM comments WHERE board_id=$1 AND NOT (task_id = ANY($2::text[]))',
      [id, ids],
    );
    await recordActivity(
      client,
      existing.workspaceId,
      userId,
      existing.archived !== data.archived
        ? data.archived
          ? 'board.archived'
          : 'board.restored'
        : 'board.updated',
      data.name,
      id,
    );
    return rows[0];
  });
}
export async function deleteBoard(id: string, userId: string, version: number) {
  return transaction(async (client) => {
    const board = await getBoard(id, userId, client, 'manage');
    const result = await client.query(
      'DELETE FROM boards WHERE id=$1 AND version=$2',
      [id, version],
    );
    if (!result.rowCount)
      throw createError({
        statusCode: 409,
        statusMessage: 'Board changed. Refresh before deleting.',
      });
    await recordActivity(
      client,
      board.workspaceId,
      userId,
      'board.deleted',
      board.name,
    );
    return { success: true };
  });
}
export async function importBoards(
  workspaceId: string,
  userId: string,
  data: z.infer<typeof importInput>,
) {
  return transaction(async (client) => {
    await memberFor(workspaceId, userId, 'write', client);
    let count = 0;
    const members = (
      await client.query<{ id: string; name: string }>(
        'SELECT u.id,u.name FROM "user" u JOIN memberships m ON m.user_id=u.id WHERE m.workspace_id=$1',
        [workspaceId],
      )
    ).rows;
    for (const project of data.projects) {
      if (
        (
          await client.query(
            'SELECT 1 FROM imports WHERE workspace_id=$1 AND user_id=$2 AND source_id=$3',
            [workspaceId, userId, project.id],
          )
        ).rowCount
      )
        continue;
      for (const section of project.dashboard)
        for (const task of section.tasks) {
          task.performer =
            members.find(
              (member) =>
                member.id === task.performer || member.name === task.performer,
            )?.id ?? '';
          task.responsiblePerson =
            members.find(
              (member) =>
                member.id === task.responsiblePerson ||
                member.name === task.responsiblePerson,
            )?.id ?? '';
        }
      const id = randomUUID();
      await client.query(
        'INSERT INTO boards(id,workspace_id,name,dashboard) VALUES ($1,$2,$3,$4)',
        [id, workspaceId, project.name, JSON.stringify(project.dashboard)],
      );
      await client.query(
        'INSERT INTO imports(workspace_id,user_id,source_id,board_id) VALUES ($1,$2,$3,$4)',
        [workspaceId, userId, project.id, id],
      );
      count++;
    }
    await recordActivity(
      client,
      workspaceId,
      userId,
      'boards.imported',
      String(count),
    );
    return { count };
  });
}
