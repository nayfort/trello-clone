import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createError } from 'h3';
import { db, transaction } from '../lib/db';
import { memberFor, recordActivity } from '../lib/access';
import { sendMail } from '../lib/mail';
import type { PoolClient } from 'pg';
import type { Workspace, Member, Section } from '../../types/board';
export async function listWorkspaces(userId: string) {
  return (
    await db().query<Workspace>(
      'SELECT w.id,w.name,m.role FROM workspaces w JOIN memberships m ON m.workspace_id=w.id WHERE m.user_id=$1 ORDER BY w.created_at',
      [userId],
    )
  ).rows;
}
export async function createWorkspace(userId: string, name: string) {
  return transaction(async (client) => {
    const id = randomUUID();
    await client.query('INSERT INTO workspaces(id,name) VALUES($1,$2)', [
      id,
      name,
    ]);
    await client.query(
      "INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'owner')",
      [id, userId],
    );
    await recordActivity(client, id, userId, 'workspace.created', name);
    return { id, name, role: 'owner' as const };
  });
}
export async function workspaceDetail(id: string, userId: string) {
  const role = await memberFor(id, userId);
  const workspace = (
    await db().query('SELECT id,name FROM workspaces WHERE id=$1', [id])
  ).rows[0];
  const members = (
    await db().query<Member>(
      'SELECT u.id,u.name,u.email,m.role FROM memberships m JOIN "user" u ON u.id=m.user_id WHERE m.workspace_id=$1 ORDER BY m.created_at',
      [id],
    )
  ).rows;
  const invitations = ['owner', 'admin'].includes(role)
    ? (
        await db().query(
          'SELECT id,email,role,expires_at AS "expiresAt" FROM invitations WHERE workspace_id=$1 AND accepted_at IS NULL AND expires_at>now() ORDER BY created_at DESC',
          [id],
        )
      ).rows
    : [];
  return { ...workspace, role, members, invitations };
}
export async function renameWorkspace(
  id: string,
  userId: string,
  name: string,
) {
  return transaction(async (client) => {
    await memberFor(id, userId, 'manage', client);
    await client.query('UPDATE workspaces SET name=$2 WHERE id=$1', [id, name]);
    await recordActivity(client, id, userId, 'workspace.renamed', name);
    return { success: true };
  });
}
export async function invite(
  id: string,
  userId: string,
  email: string,
  role: 'admin' | 'member' | 'viewer',
) {
  const token = randomBytes(32).toString('hex');
  const invitationId = randomUUID();
  const name = await transaction(async (client) => {
    const actorRole = await memberFor(id, userId, 'manage', client);
    if (role === 'admin' && actorRole !== 'owner')
      throw createError({
        statusCode: 403,
        statusMessage: 'Only owners can invite administrators',
      });
    if (
      (
        await client.query(
          'SELECT 1 FROM memberships m JOIN "user" u ON u.id=m.user_id WHERE m.workspace_id=$1 AND lower(u.email)=lower($2)',
          [id, email],
        )
      ).rowCount
    )
      throw createError({
        statusCode: 409,
        statusMessage: 'This person is already a member',
      });
    await client.query(
      'DELETE FROM invitations WHERE workspace_id=$1 AND email=$2 AND accepted_at IS NULL',
      [id, email],
    );
    await client.query(
      "INSERT INTO invitations(id,workspace_id,email,role,token_hash,expires_at,created_by) VALUES($1,$2,$3,$4,$5,now()+interval '7 days',$6)",
      [
        invitationId,
        id,
        email,
        role,
        createHash('sha256').update(token).digest('hex'),
        userId,
      ],
    );
    return (await client.query('SELECT name FROM workspaces WHERE id=$1', [id]))
      .rows[0].name as string;
  });
  try {
    await sendMail(
      email,
      `Join ${name} on Trello Clone`,
      `You have been invited to ${name}. Sign in with ${email} and accept your invitation:\n\n${process.env.BETTER_AUTH_URL}/invite?token=${token}\n\nThis invitation expires in 7 days.`,
    );
  } catch {
    await db().query('DELETE FROM invitations WHERE id=$1', [invitationId]);
    throw createError({
      statusCode: 502,
      statusMessage: 'Invitation could not be delivered. Try again.',
    });
  }
  return { success: true };
}
export async function acceptInvite(
  token: string,
  user: { id: string; email: string },
) {
  return transaction(async (client) => {
    const hash = createHash('sha256').update(token).digest('hex');
    const invitation = (
      await client.query('SELECT * FROM invitations WHERE token_hash=$1', [
        hash,
      ])
    ).rows[0];
    if (!invitation)
      throw createError({
        statusCode: 404,
        statusMessage: 'Invitation not found or expired',
      });
    await client.query('SELECT id FROM workspaces WHERE id=$1 FOR UPDATE', [
      invitation.workspace_id,
    ]);
    const current = (
      await client.query(
        'SELECT * FROM invitations WHERE id=$1 AND expires_at>now() AND accepted_at IS NULL FOR UPDATE',
        [invitation.id],
      )
    ).rows[0];
    if (!current)
      throw createError({
        statusCode: 410,
        statusMessage: 'Invitation has expired or was already used',
      });
    if (current.email.toLowerCase() !== user.email.toLowerCase())
      throw createError({
        statusCode: 403,
        statusMessage:
          'Sign in with the email address that received this invitation',
      });
    await client.query(
      'INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
      [current.workspace_id, user.id, current.role],
    );
    await client.query('UPDATE invitations SET accepted_at=now() WHERE id=$1', [
      current.id,
    ]);
    await recordActivity(
      client,
      current.workspace_id,
      user.id,
      'member.joined',
      user.email,
    );
    return { workspaceId: current.workspace_id as string };
  });
}
export async function revokeInvite(
  id: string,
  userId: string,
  invitationId: string,
) {
  return transaction(async (client) => {
    const role = await memberFor(id, userId, 'manage', client);
    const invitation = (
      await client.query<{ role: string }>(
        'SELECT role FROM invitations WHERE id=$1 AND workspace_id=$2',
        [invitationId, id],
      )
    ).rows[0];
    if (invitation?.role === 'admin' && role !== 'owner')
      throw createError({
        statusCode: 403,
        statusMessage: 'Only owners can revoke administrator invitations',
      });
    await client.query(
      'DELETE FROM invitations WHERE id=$1 AND workspace_id=$2',
      [invitationId, id],
    );
    return { success: true };
  });
}
export async function changeMember(
  id: string,
  userId: string,
  targetId: string,
  role: 'admin' | 'member' | 'viewer' | null,
) {
  return transaction(async (client) => {
    const actorRole = await memberFor(id, userId, 'manage', client);
    const target = (
      await client.query(
        'SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2',
        [id, targetId],
      )
    ).rows[0];
    if (!target)
      throw createError({ statusCode: 404, statusMessage: 'Member not found' });
    if (
      target.role === 'owner' ||
      (actorRole !== 'owner' && (target.role === 'admin' || role === 'admin'))
    )
      throw createError({
        statusCode: 403,
        statusMessage:
          'Only the owner can manage administrators; transfer ownership before removing an owner',
      });
    if (role)
      await client.query(
        'UPDATE memberships SET role=$3 WHERE workspace_id=$1 AND user_id=$2',
        [id, targetId, role],
      );
    else {
      await client.query(
        'DELETE FROM memberships WHERE workspace_id=$1 AND user_id=$2',
        [id, targetId],
      );
      await clearAssignments(client, id, targetId);
    }
    await recordActivity(
      client,
      id,
      userId,
      role ? 'member.role_changed' : 'member.removed',
      targetId,
    );
    return { success: true };
  });
}
export async function transferOwnership(
  id: string,
  userId: string,
  targetId: string,
) {
  return transaction(async (client) => {
    await memberFor(id, userId, 'owner', client);
    if (
      targetId === userId ||
      !(
        await client.query(
          'SELECT 1 FROM memberships WHERE workspace_id=$1 AND user_id=$2',
          [id, targetId],
        )
      ).rowCount
    )
      throw createError({
        statusCode: 400,
        statusMessage: 'Choose another workspace member',
      });
    await client.query(
      "UPDATE memberships SET role='admin' WHERE workspace_id=$1 AND user_id=$2",
      [id, userId],
    );
    await client.query(
      "UPDATE memberships SET role='owner' WHERE workspace_id=$1 AND user_id=$2",
      [id, targetId],
    );
    await recordActivity(client, id, userId, 'workspace.transferred', targetId);
    return { success: true };
  });
}
export async function activityFeed(id: string, userId: string) {
  await memberFor(id, userId);
  return (
    await db().query(
      'SELECT a.id::text,a.action,a.detail,a.created_at AS "createdAt",u.name AS "actorName" FROM activity a JOIN "user" u ON u.id=a.actor_id WHERE workspace_id=$1 ORDER BY a.id DESC LIMIT 100',
      [id],
    )
  ).rows;
}

export async function deleteWorkspace(
  id: string,
  userId: string,
  name: string,
) {
  return transaction(async (client) => {
    await memberFor(id, userId, 'owner', client);
    const result = await client.query(
      'DELETE FROM workspaces WHERE id=$1 AND name=$2',
      [id, name],
    );
    if (!result.rowCount)
      throw createError({
        statusCode: 409,
        statusMessage: 'Enter the current workspace name to confirm deletion',
      });
    return { success: true };
  });
}
export async function leaveWorkspace(id: string, userId: string) {
  return transaction(async (client) => {
    const role = await memberFor(id, userId, 'read', client);
    if (role === 'owner')
      throw createError({
        statusCode: 409,
        statusMessage: 'Transfer ownership before leaving the workspace',
      });
    await client.query(
      'DELETE FROM memberships WHERE workspace_id=$1 AND user_id=$2',
      [id, userId],
    );
    await clearAssignments(client, id, userId);
    await recordActivity(client, id, userId, 'member.left', userId);
    return { success: true };
  });
}

async function clearAssignments(
  client: PoolClient,
  id: string,
  userId: string,
) {
  const boards = (
    await client.query<{
      id: string;
      dashboard: Section[];
    }>('SELECT id,dashboard FROM boards WHERE workspace_id=$1', [id])
  ).rows;
  for (const board of boards) {
    let changed = false;
    for (const section of board.dashboard)
      for (const task of section.tasks)
        for (const key of ['performer', 'responsiblePerson'] as const)
          if (task[key] === userId) {
            task[key] = '';
            changed = true;
          }
    if (changed)
      await client.query(
        'UPDATE boards SET dashboard=$2,version=version+1,updated_at=now() WHERE id=$1',
        [board.id, JSON.stringify(board.dashboard)],
      );
  }
}
