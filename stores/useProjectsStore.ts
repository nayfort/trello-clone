import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import { projectStorage, storageIssue } from '~/lib/projectStorage';
import { normalizeTask } from '~/lib/board';
import {
  sectionStatuses,
  type Project,
  type Task,
  type SectionStatus,
} from '~/types/board';

export { Priority } from '~/types/board';
export type { Project, Section, Task } from '~/types/board';

const createProject = (name: string): Project => ({
  id: nanoid(),
  name,
  dashboard: sectionStatuses.map((status) => ({ status, tasks: [] })),
});

export const useProjectsStore = defineStore('projects-store', {
  state: () => ({ projects: [] as Project[], initialized: false }),
  actions: {
    init() {
      if (this.initialized || storageIssue.value === 'read') return;
      if (!this.projects.length)
        this.projects.push(createProject('Test project'));
      this.initialized = true;
    },
    getProject(id: string) {
      return this.projects.find((project) => project.id === id);
    },
    getSection(projectId: string, status: SectionStatus) {
      return this.getProject(projectId)?.dashboard.find(
        (section) => section.status === status,
      );
    },
    addProject(name: string) {
      if (name.trim()) this.projects.push(createProject(name.trim()));
    },
    updateProjectName(id: string, name: string) {
      const project = this.getProject(id);
      if (project && name.trim()) project.name = name.trim();
    },
    deleteProject(id: string) {
      this.projects = this.projects.filter((project) => project.id !== id);
    },
    addTask(projectId: string, status: SectionStatus, task: Task) {
      const section = this.getSection(projectId, status);
      const fields = normalizeTask(task);
      if (section && fields) section.tasks.push({ ...task, ...fields, status });
    },
    editTask({
      projectId,
      status,
      task,
    }: {
      projectId: string;
      status: SectionStatus;
      task: Task;
    }) {
      const section = this.getSection(projectId, status);
      const fields = normalizeTask(task);
      const index =
        section?.tasks.findIndex((item) => item.id === task.id) ?? -1;
      if (section && fields && index >= 0)
        section.tasks[index] = { ...task, ...fields, status };
    },
    setSectionTasks(projectId: string, status: SectionStatus, tasks: Task[]) {
      const section = this.getSection(projectId, status);
      if (section) section.tasks = tasks.map((task) => ({ ...task, status }));
    },
    moveTask(
      projectId: string,
      taskId: string,
      from: SectionStatus,
      to: SectionStatus,
    ) {
      if (from === to) return;
      const source = this.getSection(projectId, from);
      const destination = this.getSection(projectId, to);
      const index = source?.tasks.findIndex((task) => task.id === taskId) ?? -1;
      if (!source || !destination || index < 0) return;
      const [task] = source.tasks.splice(index, 1);
      destination.tasks.push({ ...task, status: to });
    },
    deleteTask({
      projectId,
      status,
      taskId,
    }: {
      projectId: string;
      status: SectionStatus;
      taskId: string;
    }) {
      const section = this.getSection(projectId, status);
      if (section)
        section.tasks = section.tasks.filter((task) => task.id !== taskId);
    },
  },
  persist: { storage: projectStorage },
});
