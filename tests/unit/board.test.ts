import { describe, it, expect } from 'vitest';
import {
  dashboardSchema,
  canWrite,
  canManage,
  boardInput,
  inviteInput,
} from '../../shared/schemas';
const task = () => ({
  id: 'one',
  name: 'Task',
  description: 'Description',
  status: 'TODO',
  performer: '',
  responsiblePerson: '',
  priority: 'low',
  dueDate: '',
  labels: [],
  checklist: [],
});
const dashboard = () => [
  { status: 'TODO', tasks: [task()] },
  { status: 'In progress', tasks: [] },
  { status: 'Done', tasks: [] },
];
describe('board contracts', () => {
  it('accepts a complete board and defaults optional legacy fields', () => {
    const board = dashboard();
    expect(dashboardSchema.parse(board)).toEqual(board);
    const legacy = {
      ...task(),
      dueDate: undefined,
      labels: undefined,
      checklist: undefined,
    };
    expect(
      dashboardSchema.parse([
        { status: 'TODO', tasks: [legacy] },
        ...board.slice(1),
      ])[0].tasks[0].checklist,
    ).toEqual([]);
  });
  it('rejects duplicate task IDs across columns', () => {
    const board = dashboard();
    board[1].tasks.push({ ...task(), status: 'In progress' });
    expect(dashboardSchema.safeParse(board).success).toBe(false);
  });
  it('rejects duplicate status columns and mismatched task status', () => {
    const board = dashboard();
    board[1].status = 'TODO';
    expect(dashboardSchema.safeParse(board).success).toBe(false);
    board[1].status = 'In progress';
    board[0].tasks[0].status = 'Done';
    expect(dashboardSchema.safeParse(board).success).toBe(false);
  });
  it('rejects impossible dates and oversized descriptions', () => {
    const board = dashboard();
    board[0].tasks[0].dueDate = '2026-02-30';
    expect(dashboardSchema.safeParse(board).success).toBe(false);
    board[0].tasks[0].dueDate = '';
    board[0].tasks[0].description = 'a'.repeat(20001);
    expect(dashboardSchema.safeParse(board).success).toBe(false);
  });
  it('requires a positive version and rejects extra board fields', () => {
    expect(
      boardInput.safeParse({
        name: 'Board',
        dashboard: dashboard(),
        archived: false,
        version: 0,
      }).success,
    ).toBe(false);
    expect(
      boardInput.safeParse({
        name: 'Board',
        dashboard: dashboard(),
        archived: false,
        version: 1,
        workspaceId: 'foreign',
      }).success,
    ).toBe(false);
  });
  it('normalizes invitation email and cannot invite owners', () => {
    expect(
      inviteInput.parse({ email: 'Person@Example.com', role: 'member' }).email,
    ).toBe('person@example.com');
    expect(
      inviteInput.safeParse({ email: 'person@example.com', role: 'owner' })
        .success,
    ).toBe(false);
  });
});
describe('roles', () => {
  it.each(['owner', 'admin', 'member'])('%s can edit', (role) =>
    expect(canWrite(role)).toBe(true),
  );
  it('viewers cannot edit and members cannot administer', () => {
    expect(canWrite('viewer')).toBe(false);
    expect(canWrite('unknown')).toBe(false);
    expect(canManage('member')).toBe(false);
    expect(canManage('admin')).toBe(true);
    expect(canManage('owner')).toBe(true);
  });
});
