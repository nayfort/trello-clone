import { Priority, type TaskFields, type SectionStatus } from '~/types/board';

export const statusKeys: Record<SectionStatus, string> = {
  TODO: 'TODO',
  'In progress': 'IN_PROGRESS',
  Done: 'DONE',
};

export function emptyTask(): TaskFields {
  return {
    name: '',
    description: '',
    performer: '',
    responsiblePerson: '',
    priority: Priority.Low,
  };
}

export function normalizeTask(fields: TaskFields): TaskFields | null {
  const name = fields.name.trim();
  const description = fields.description.trim();
  if (!name || !description) return null;
  return {
    ...fields,
    name,
    description,
    priority: fields.priority || Priority.Low,
  };
}
