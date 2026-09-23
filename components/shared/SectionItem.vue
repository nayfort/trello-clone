<template>
	<section
		class="bg-white dark:bg-slate-500 rounded-lg p-4 min-w-[300px] border h-max"
	>
		<h2 class="text-lg font-bold mb-3">{{ section.status }}</h2>

		<draggable
			v-model="tasks"
			:group="{ name: 'tasks', pull: true, put: true }"
			tag="ul"
			class="min-h-10 space-y-2"
			item-key="id"
			:animation="300"
		>
			<template #item="{ element }">
				<SharedTaskItem
					:key="element.id"
					:task="element"
					:sectionStatus="section.status"
					:projectId="projectId"
					@edit="projectStore.editTask"
					@delete="projectStore.deleteTask"
				/>
			</template>
		</draggable>

		<div class="flex justify-end mt-5">
			<SharedModal
				:title="$t('ADD_TASK')"
				:locked="isLocked"
				:trigger-label="$t('ADD_TASK')"
			>
				<template #trigger>
					<Icon
						icon="mdi:add"
						class="cursor-pointer"
					/>
				</template>
				<template #content>
					<div class="flex flex-col gap-3">
						<Input
							type="text"
							:placeholder="`${$t('NAME')}*`"
							v-model="task.name"
							:class="errors.name && 'border-red-500'"
						/>
						<Textarea
							v-model="task.description"
							:placeholder="`${$t('DESCRIPTION')}*`"
							:class="errors.description && 'border-red-500'"
						/>
						<SharedSelect
							:placeholder="$t('SELECT_RESPONSIBLE_PERSON')"
							:options="responsiblePersonList"
							v-model="task.responsiblePerson"
						/>
						<SharedSelect
							:placeholder="$t('SELECT_PERFORMER')"
							:options="performerList"
							v-model="task.performer"
						/>
						<SharedSelect
							:placeholder="$t('SELECT_PRIORITY')"
							:options="PriorityOptions"
							v-model="selectedPriority"
						/>
					</div>
				</template>
				<template #triggerButton>
					<Button variant="outline" @click="addTask"> {{ $t('ADD') }} </Button>
				</template>
			</SharedModal>
		</div>
	</section>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import { Icon } from '@iconify/vue';
import { nanoid } from 'nanoid';
import {
	Priority,
	useProjectsStore,
	type Section,
	type Task,
} from '~/stores/useProjectsStore';
import {
	PriorityOptions,
	performerList,
	responsiblePersonList,
} from '~/lib/constants';

interface TaskFormState {
	name: string;
	description: string;
	performer: string;
	responsiblePerson: string;
	priority: Priority;
}

const props = defineProps<{
	section: Section;
	projectId: string;
}>();

const projectStore = useProjectsStore();

const errors = ref({
	name: false,
	description: false,
});

const isLocked = computed(() => {
	return errors.value.name || errors.value.description;
});

const createEmptyTask = (): TaskFormState => ({
	name: '',
	description: '',
	performer: '',
	responsiblePerson: '',
	priority: Priority.Low,
});

const task = ref<TaskFormState>(createEmptyTask());

const tasks = computed<Task[]>({
	get() {
		return props.section.tasks;
	},
	set(value) {
		projectStore.setSectionTasks(props.projectId, props.section.status, value);
	},
});

const selectedPriority = computed({
	get() {
		return task.value.priority;
	},
	set(priority: string) {
		task.value.priority = (priority || Priority.Low) as Priority;
	},
});

const addTask = () => {
	const name = task.value.name.trim();
	const description = task.value.description.trim();

	if (!name) {
		errors.value.name = true;
	} else {
		errors.value.name = false;
	}

	if (!description) {
		errors.value.description = true;
	} else {
		errors.value.description = false;
	}

	if (errors.value.name || errors.value.description) {
		return;
	}

	projectStore.addTask(props.projectId, props.section.status, {
		id: nanoid(),
		name,
		responsiblePerson: task.value.responsiblePerson,
		performer: task.value.performer,
		description,
		priority: task.value.priority,
		status: props.section.status,
	});

	task.value = createEmptyTask();
};
</script>
