import { ref } from 'vue';
import { Priority, sectionStatuses } from '~/types/board';

export const storageIssue = ref<'read' | 'write' | null>(null);
let preserveUnreadData = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeState(value: string): string {
  const state: unknown = JSON.parse(value);
  if (!isRecord(state) || !Array.isArray(state.projects))
    throw new Error('Invalid saved projects');
  const projectIds = new Set<string>();
  for (const project of state.projects) {
    if (
      !isRecord(project) ||
      typeof project.id !== 'string' ||
      typeof project.name !== 'string' ||
      !Array.isArray(project.dashboard) ||
      projectIds.has(project.id)
    )
      throw new Error('Invalid project');
    projectIds.add(project.id);
    const taskIds = new Set<string>();
    if (project.dashboard.length !== sectionStatuses.length)
      throw new Error('Invalid board');
    for (const status of sectionStatuses) {
      const section = project.dashboard.find(
        (item: unknown) => isRecord(item) && item.status === status,
      );
      if (!isRecord(section) || !Array.isArray(section.tasks))
        throw new Error('Invalid section');
      for (const task of section.tasks) {
        if (isRecord(task) && (task.priority === '' || task.priority == null)) {
          task.priority = Priority.Low;
        }
        if (
          !isRecord(task) ||
          ![
            'id',
            'name',
            'description',
            'performer',
            'responsiblePerson',
          ].every((key) => typeof task[key] === 'string') ||
          !Object.values(Priority).includes(task.priority as Priority) ||
          taskIds.has(task.id as string)
        )
          throw new Error('Invalid task');
        taskIds.add(task.id as string);
        task.status = status;
      }
    }
  }
  // A saved empty workspace must stay empty, including when migrating old cookies.
  return JSON.stringify({ projects: state.projects, initialized: true });
}

export const projectStorage = {
  getItem(key: string): string | null {
    if (import.meta.server) return null;
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return decodeState(stored);
      const prefix = `${encodeURIComponent(key)}=`;
      const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith(prefix));
      if (!cookie) return null;
      const value = decodeState(
        decodeURIComponent(cookie.slice(prefix.length)),
      );
      // Delete the legacy cookie only after migration succeeds.
      localStorage.setItem(key, value);
      document.cookie = `${prefix}; Max-Age=0; Path=/`;
      return value;
    } catch {
      preserveUnreadData = true;
      storageIssue.value = 'read';
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (import.meta.server || preserveUnreadData) return;
    try {
      localStorage.setItem(key, value);
      storageIssue.value = null;
    } catch {
      storageIssue.value = 'write';
    }
  },
};
