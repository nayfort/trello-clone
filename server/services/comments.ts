import { randomUUID } from 'node:crypto';
import { createError } from 'h3';
import { db, transaction } from '../lib/db';
import { memberFor, recordActivity } from '../lib/access';
import { getBoard } from './boards';
import { canManage } from '../../shared/schemas';
const columns =
  'c.id,c.body,c.author_id AS "authorId",u.name AS "authorName",c.created_at AS "createdAt"';
export async function listComments(
  boardId: string,
  userId: string,
  taskId: string,
) {
  await getBoard(boardId, userId);
  return (
    await db().query(
      `SELECT ${columns} FROM comments c JOIN "user" u ON u.id=c.author_id WHERE c.board_id=$1 AND c.task_id=$2 ORDER BY c.created_at`,
      [boardId, taskId],
    )
  ).rows;
}
export async function addComment(
  boardId: string,
  userId: string,
  taskId: string,
  body: string,
) {
  return transaction(async (client) => {
    const board = await getBoard(boardId, userId, client, 'write');
    if (
      board.archived ||
      !board.dashboard.some((section) =>
        section.tasks.some((task) => task.id === taskId),
      )
    )
      throw createError({
        statusCode: 404,
        statusMessage: 'Active task not found',
      });
    const id = randomUUID();
    await client.query(
      'INSERT INTO comments(id,board_id,task_id,author_id,body) VALUES($1,$2,$3,$4,$5)',
      [id, boardId, taskId, userId, body],
    );
    await recordActivity(
      client,
      board.workspaceId,
      userId,
      'comment.added',
      board.name,
      boardId,
    );
    return { id };
  });
}
export async function removeComment(
  boardId: string,
  userId: string,
  commentId: string,
) {
  return transaction(async (client) => {
    const board = await getBoard(boardId, userId, client, 'write');
    if (board.archived)
      throw createError({
        statusCode: 409,
        statusMessage: 'Restore the board before changing comments',
      });
    const role = await memberFor(board.workspaceId, userId, 'write', client);
    const row = (
      await client.query(
        'SELECT author_id FROM comments WHERE id=$1 AND board_id=$2',
        [commentId, boardId],
      )
    ).rows[0];
    if (!row)
      throw createError({
        statusCode: 404,
        statusMessage: 'Comment not found',
      });
    if (row.author_id !== userId && !canManage(role))
      throw createError({
        statusCode: 403,
        statusMessage:
          'Only the author or an administrator can remove this comment',
      });
    await client.query('DELETE FROM comments WHERE id=$1', [commentId]);
    return { success: true };
  });
}
