export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export const sectionStatuses = ['TODO', 'In progress', 'Done'] as const;
export type SectionStatus = (typeof sectionStatuses)[number];
export interface TaskFields {
  name: string;
  description: string;
  performer: string;
  responsiblePerson: string;
  priority: Priority;
  dueDate: string;
  labels: string[];
  checklist: { id: string; text: string; done: boolean }[];
}
export interface Task extends TaskFields {
  id: string;
  status: SectionStatus;
}
export interface Section {
  status: SectionStatus;
  tasks: Task[];
}
export interface Project {
  id: string;
  name: string;
  dashboard: Section[];
  workspaceId: string;
  version: number;
  archived: boolean;
  updatedAt: string;
}

export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export interface Workspace {
  id: string;
  name: string;
  role: Role;
}
export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface BoardComment {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}
export interface Activity {
  id: string;
  action: string;
  detail: string;
  actorName: string;
  createdAt: string;
}
