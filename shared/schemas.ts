import { z } from 'zod';
import { sectionStatuses } from '../types/board';
const text = (max: number) => z.string().trim().min(1).max(max);
export const roleSchema = z.enum(['admin', 'member', 'viewer']);
export const taskSchema = z
  .object({
    id: text(100),
    name: text(200),
    description: text(20000),
    status: z.enum(sectionStatuses),
    performer: z.string().max(100).default(''),
    responsiblePerson: z.string().max(100).default(''),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.union([z.literal(''), z.iso.date()]).default(''),
    labels: z.array(text(30)).max(10).default([]),
    checklist: z
      .array(z.object({ id: text(100), text: text(300), done: z.boolean() }))
      .max(100)
      .default([]),
  })
  .strict();
export const dashboardSchema = z
  .array(
    z
      .object({
        status: z.enum(sectionStatuses),
        tasks: z.array(taskSchema).max(1000),
      })
      .strict(),
  )
  .length(3)
  .superRefine((sections, context) => {
    const statuses = new Set(sections.map((section) => section.status));
    const taskIds = new Set<string>();
    if (statuses.size !== 3)
      context.addIssue({
        code: 'custom',
        message: 'Each status must appear once',
      });
    for (const section of sections)
      for (const task of section.tasks) {
        if (task.status !== section.status || taskIds.has(task.id))
          context.addIssue({
            code: 'custom',
            message: 'Invalid task placement',
          });
        taskIds.add(task.id);
        if (
          new Set(task.checklist.map((item) => item.id)).size !==
          task.checklist.length
        )
          context.addIssue({
            code: 'custom',
            message: 'Checklist IDs must be unique',
          });
      }
  });
export const boardInput = z
  .object({
    name: text(120),
    dashboard: dashboardSchema,
    version: z.number().int().positive(),
    archived: z.boolean(),
  })
  .strict();
export const nameInput = z.object({ name: text(120) }).strict();
export const inviteInput = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    role: roleSchema,
  })
  .strict();
export const importInput = z.object({
  projects: z
    .array(
      z.object({ id: text(100), name: text(120), dashboard: dashboardSchema }),
    )
    .min(1)
    .max(100),
});
export const commentInput = z
  .object({ taskId: text(100), body: text(5000) })
  .strict();
export const canWrite = (role: string) =>
  ['owner', 'admin', 'member'].includes(role);
export const canManage = (role: string) => ['owner', 'admin'].includes(role);
