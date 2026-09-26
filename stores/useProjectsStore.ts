import { FetchError } from 'ofetch';
import { nanoid } from 'nanoid';
import { apiFetch } from '~/lib/api';
import { defineStore } from 'pinia';
import { canManage, canWrite } from '~/shared/schemas';
import type {
  Project,
  Task,
  SectionStatus,
  Workspace,
  Member,
  Activity,
} from '~/types/board';
export const useProjectsStore = defineStore('projects-store', {
  state: () => ({
    projects: [] as Project[],
    conflicts: {} as Record<string, Project>,
    loadToken: '',
    workspaces: [] as Workspace[],
    workspaceId: '',
    members: [] as Member[],
    initialized: false,
    busy: false,
    error: '',
    editLocks: 0,
    dragBackup: null as Project | null,
    search: '',
    priorityFilter: '',
    assigneeFilter: '',
    showArchived: false,
    activity: [] as Activity[],
  }),
  getters: {
    workspace: (state) =>
      state.workspaces.find((item) => item.id === state.workspaceId),
    writable(): boolean {
      return canWrite(this.workspace?.role ?? 'viewer');
    },
    manageable(): boolean {
      return canManage(this.workspace?.role ?? 'viewer');
    },
    filtered(): boolean {
      return Boolean(
        this.search.trim() || this.priorityFilter || this.assigneeFilter,
      );
    },
  },
  actions: {
    async request<T>(fn: () => Promise<T>): Promise<T | null> {
      if (this.busy) return null;
      this.loadToken = nanoid();
      this.busy = true;
      this.error = '';
      try {
        return await fn();
      } catch (error: unknown) {
        this.error =
          (error instanceof FetchError && error.data?.statusMessage) ||
          (error instanceof Error && error.message) ||
          'Request failed. Try again.';
        if (
          error instanceof FetchError &&
          error.statusCode === 409 &&
          !this.editLocks
        )
          await this.refresh(true);
        return null;
      } finally {
        this.busy = false;
      }
    },
    async load(headers?: Record<string, string>) {
      const token = nanoid();
      this.loadToken = token;
      const workspaces = await apiFetch<Workspace[]>('/api/workspaces', {
        headers,
      });
      if (token !== this.loadToken) return;
      this.workspaces = workspaces;
      if (!this.workspaces.some((item) => item.id === this.workspaceId))
        this.workspaceId = this.workspaces[0]?.id ?? '';
      if (this.workspaceId) {
        const [boards, workspace] = await Promise.all([
          apiFetch<Project[]>(`/api/workspaces/${this.workspaceId}/boards`, {
            headers,
          }),
          apiFetch<{ members: Member[] }>(
            `/api/workspaces/${this.workspaceId}`,
            { headers },
          ),
        ]);
        if (token !== this.loadToken) return;
        this.projects = boards;
        this.conflicts = {};
        this.members = workspace.members;
      } else {
        this.projects = [];
        this.members = [];
      }
      this.initialized = true;
    },
    async refresh(force = false) {
      if (
        !this.workspaceId ||
        (!force && (this.busy || this.editLocks || this.dragBackup))
      )
        return;
      try {
        await this.load();
      } catch (error: unknown) {
        this.error =
          (error instanceof FetchError && error.data?.statusMessage) ||
          'Connection lost. Your changes have not been discarded.';
      }
    },
    async selectWorkspace(id: string) {
      if (this.busy || this.editLocks) return;
      this.workspaceId = id;
      this.search = '';
      this.priorityFilter = '';
      this.assigneeFilter = '';
      await this.request(() => this.load());
    },
    async createWorkspace(name: string) {
      return this.request(async () => {
        const workspace = await apiFetch<Workspace>('/api/workspaces', {
          method: 'POST',
          body: { name },
        });
        this.workspaceId = workspace.id;
        await this.load();
        return true;
      });
    },
    getProject(id: string) {
      return this.projects.find((project) => project.id === id);
    },
    async addProject(name: string) {
      return this.request(async () => {
        const project = await apiFetch<Project>(
          `/api/workspaces/${this.workspaceId}/boards`,
          { method: 'POST', body: { name } },
        );
        this.projects.push(project);
        return true;
      });
    },
    async mutate(id: string, edit: (project: Project) => void) {
      const original = this.conflicts[id] ?? this.getProject(id);
      if (!original || !this.writable) return null;
      return this.request(async () => {
        const draft = JSON.parse(JSON.stringify(original)) as Project;
        edit(draft);
        let project: Project;
        try {
          project = await apiFetch<Project>(`/api/boards/${id}`, {
            method: 'PUT',
            body: {
              name: draft.name,
              dashboard: draft.dashboard,
              version: original.version,
              archived: draft.archived,
            },
          });
        } catch (error) {
          if (
            error instanceof FetchError &&
            error.statusCode === 409 &&
            this.editLocks
          ) {
            this.conflicts[id] = await apiFetch<Project>(`/api/boards/${id}`);
            throw new Error(
              'This board changed. Your draft is still open. Save again to apply it to the latest board, or cancel to review the changes.',
            );
          }
          throw error;
        }
        delete this.conflicts[id];
        const index = this.projects.findIndex((item) => item.id === id);
        if (index >= 0) this.projects[index] = project;
        return true;
      });
    },
    updateProjectName(id: string, name: string) {
      return this.mutate(id, (project) => {
        project.name = name.trim();
      });
    },
    archiveProject(id: string, archived: boolean) {
      return this.mutate(id, (project) => {
        project.archived = archived;
      });
    },
    async deleteProject(id: string) {
      return this.request(async () => {
        const board = this.getProject(id);
        if (!board) return false;
        await apiFetch(`/api/boards/${id}`, {
          method: 'DELETE',
          body: { version: board.version },
        });
        this.projects = this.projects.filter((item) => item.id !== id);
        return true;
      });
    },
    addTask(projectId: string, status: SectionStatus, task: Task) {
      return this.mutate(projectId, (project) => {
        project.dashboard
          .find((section) => section.status === status)
          ?.tasks.push({ ...task, status });
      });
    },
    editTask({
      projectId,
      status,
      task,
      newStatus = status,
    }: {
      projectId: string;
      status: SectionStatus;
      task: Task;
      newStatus?: SectionStatus;
    }) {
      return this.mutate(projectId, (project) => {
        const source = project.dashboard.find((section) =>
          section.tasks.some((item) => item.id === task.id),
        );
        const index =
          source?.tasks.findIndex((item) => item.id === task.id) ?? -1;
        if (!source || index < 0)
          throw new Error(
            'This task was removed by another member. Copy your draft before closing it.',
          );
        if (newStatus === source.status)
          source.tasks[index] = { ...task, status: newStatus };
        else {
          source.tasks.splice(index, 1);
          project.dashboard
            .find((section) => section.status === newStatus)
            ?.tasks.push({ ...task, status: newStatus });
        }
      });
    },
    deleteTask({
      projectId,
      taskId,
    }: {
      projectId: string;
      status: SectionStatus;
      taskId: string;
    }) {
      return this.mutate(projectId, (project) => {
        const section = project.dashboard.find((section) =>
          section.tasks.some((task) => task.id === taskId),
        );
        if (section)
          section.tasks = section.tasks.filter((task) => task.id !== taskId);
      });
    },
    beginDrag(id: string) {
      this.dragBackup = JSON.parse(JSON.stringify(this.getProject(id)));
    },
    async finishDrag(id: string) {
      const board = this.getProject(id);
      const backup = this.dragBackup;
      if (!board || !backup) return;
      const draft = JSON.parse(JSON.stringify(board)) as Project;
      for (const section of draft.dashboard)
        for (const task of section.tasks) task.status = section.status;
      this.projects[this.projects.findIndex((item) => item.id === id)] = backup;
      this.dragBackup = null;
      await this.mutate(id, (project) => {
        project.dashboard = draft.dashboard;
      });
    },
    matches(task: Task) {
      const query = this.search.trim().toLocaleLowerCase();
      return (
        (!query ||
          `${task.name} ${task.description} ${task.labels.join(' ')}`
            .toLocaleLowerCase()
            .includes(query)) &&
        (!this.priorityFilter || task.priority === this.priorityFilter) &&
        (!this.assigneeFilter || task.performer === this.assigneeFilter)
      );
    },
    memberName(id: string) {
      return this.members.find((member) => member.id === id)?.name ?? '';
    },
    async importProjects(projects: unknown) {
      return this.request(async () => {
        const result = await apiFetch<{ count: number }>(
          `/api/workspaces/${this.workspaceId}/import`,
          { method: 'POST', body: { projects } },
        );
        await this.load();
        return result;
      });
    },
  },
});
