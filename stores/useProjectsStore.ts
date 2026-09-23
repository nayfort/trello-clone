import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import { projectStorage } from '~/lib/projectStorage';

export interface Task {
	id: string;
	name: string;
	status: string;
	performer: string;
	responsiblePerson: string;
	description: string;
	priority: Priority;
}
export interface Section {
	status: string;
	tasks: Task[];
}
export interface Project {
	id: string;
	name: string;
	dashboard: Section[];
}

export enum Priority {
	Low = 'low',
	Medium = 'medium',
	High = 'high',
}

const defaultSectionStatuses = ['TODO', 'In progress', 'Done'];

const createDefaultDashboard = (): Section[] =>
	defaultSectionStatuses.map((status) => ({
		status,
		tasks: [],
	}));

const createProject = (name: string): Project => ({
	id: nanoid(),
	name,
	dashboard: createDefaultDashboard(),
});

export const useProjectsStore = defineStore('projects-store', {
	state: () => ({
		projects: [] as Project[],
		initialized: false,
	}),
	actions: {
		init() {
			if (this.initialized) {
				return;
			}

			if (this.projects.length === 0) {
				this.projects.push(createProject('Test project'));
			}
			this.initialized = true;
		},
		addProject(name: string) {
			const trimmedName = name.trim();

			if (!trimmedName) {
				return;
			}

			this.projects.push(createProject(trimmedName));
		},
		getProject(id: string): Project | undefined {
			return this.projects.find((project) => project.id === id);
		},
		updateProjectName(id: string, name: string) {
			const trimmedName = name.trim();
			const project = this.projects.find((project) => project.id === id);

			if (!project || !trimmedName) {
				return;
			}

			project.name = trimmedName;
		},
		deleteProject(id: string) {
			const filteredProjects = this.projects.filter(
				(project) => project.id !== id
			);
			this.projects = filteredProjects;
		},

		addTask(projectId: string, status: string, task: Task) {
			const projectIndex = this.projects.findIndex((p) => p.id === projectId);
			if (projectIndex !== -1) {
				const section = this.projects[projectIndex].dashboard.find(
					(s) => s.status === status
				);
				if (section) {
					section.tasks.push(task);
					this.projects[projectIndex] = {
						...this.projects[projectIndex],
						dashboard: [...this.projects[projectIndex].dashboard],
					};
				}
			}
		},
		editTask({
			projectId,
			status,
			task,
		}: {
			projectId: string;
			status: string;
			task: Task;
		}) {
			const projectIndex = this.projects.findIndex((p) => p.id === projectId);
			if (projectIndex !== -1) {
				const section = this.projects[projectIndex].dashboard.find(
					(s) => s.status === status
				);
				if (section) {
					const taskIndex = section.tasks.findIndex((t) => t.id === task.id);
					if (taskIndex !== -1) {
						section.tasks[taskIndex] = task;
						this.projects[projectIndex] = {
							...this.projects[projectIndex],
							dashboard: [...this.projects[projectIndex].dashboard],
						};
					}
				}
			}
		},
		setSectionTasks(projectId: string, status: string, tasks: Task[]) {
			const project = this.projects.find((project) => project.id === projectId);
			const section = project?.dashboard.find(
				(section) => section.status === status
			);

			if (!section) {
				return;
			}

			section.tasks = tasks.map((task) => ({
				...task,
				status,
			}));
		},
		deleteTask({
			projectId,
			status,
			taskId,
		}: {
			projectId: string;
			status: string;
			taskId: string;
		}) {
			const projectIndex = this.projects.findIndex((p) => p.id === projectId);
			if (projectIndex !== -1) {
				const section = this.projects[projectIndex].dashboard.find(
					(s) => s.status === status
				);
				if (section) {
					const taskIndex = section.tasks.findIndex((t) => t.id === taskId);
					if (taskIndex !== -1) {
						section.tasks.splice(taskIndex, 1);
						this.projects[projectIndex] = {
							...this.projects[projectIndex],
							dashboard: [...this.projects[projectIndex].dashboard],
						};
					}
				}
			}
		},
	},
	persist: { storage: projectStorage },
});
