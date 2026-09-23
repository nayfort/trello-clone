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
}
