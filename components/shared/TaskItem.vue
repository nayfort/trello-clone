<template>
	<li
		class="bg-slate-300 dark:bg-slate-300 py-1 px-2 text-black rounded cursor-pointer"
		:data-id="task.id"
	>
		<SharedModal v-if="!editName" :title="$t('DETAILS')" @close="cancelDraft">
			<template #trigger>
				<div class="flex items-center justify-between gap-2 w-full">
					{{ task.name }}
					<Icon
						icon="mdi:rename"
						@click.stop="startNameEdit"
					/>
				</div>
			</template>
			<template #header>
				<div class="flex flex-col gap-2 p-5 border mt-3">
					<div class="flex items-center gap-1">
						<p class="font-bold text-slate-500">{{ $t('STATUS') }}:</p>
						<p>{{ task.status }}</p>
					</div>
					<div class="flex items-center gap-1">
						<p class="font-bold text-slate-500">{{ $t('PERFORMER') }}:</p>
						<p v-if="task.performer && !detailsEdit">{{ task.performer }}</p>
						<Icon
							icon="mdi:add"
							class="cursor-pointer"
							v-if="!task.performer && !detailsEdit"
							@click="startDetailsEdit"
						/>
						<SharedSelect
							v-if="detailsEdit"
							:placeholder="$t('SELECT_PERFORMER')"
							:options="performerList"
							v-model="taskData.performer"
						/>
					</div>
					<div class="flex items-center gap-1">
						<p class="font-bold text-slate-500">
							{{ $t('RESPONSIBLE_PERSON') }}:
						</p>
						<p v-if="task.responsiblePerson && !detailsEdit">
							{{ task.responsiblePerson }}
						</p>
						<Icon
							icon="mdi:add"
							class="cursor-pointer"
							v-if="!task.responsiblePerson && !detailsEdit"
							@click="startDetailsEdit"
						/>
						<SharedSelect
							v-if="detailsEdit"
							:placeholder="$t('SELECT_RESPONSIBLE_PERSON')"
							:options="responsiblePersonList"
							v-model="taskData.responsiblePerson"
						/>
					</div>
				</div>
			</template>
			<template #content>
				<ul class="flex flex-col gap-2 max-w-[450px]">
					<li class="flex items-center gap-2">
						<p class="font-bold text-slate-500">{{ $t('NAME') }}:</p>
						<p class="text-lg" v-if="!detailsEdit">{{ task.name }}</p>
						<Input v-else v-model="taskData.name" />
					</li>
					<li class="flex items-center gap-2 flex-wrap">
						<p class="font-bold text-slate-500">{{ $t('DESCRIPTION') }}:</p>
						<div class="text-lg break-words max-w-full" v-if="!detailsEdit">
							{{ task.description }}
						</div>
						<Textarea v-else v-model="taskData.description" />
					</li>
					<li class="flex items-center gap-2">
						<p class="font-bold text-slate-500">{{ $t('PRIORITY') }}:</p>
						<div
							v-if="!detailsEdit"
							class="w-2 h-2 rounded-full p-2"
							:class="{
								'bg-blue-500': task.priority === Priority.Low,
								'bg-yellow-500': task.priority === Priority.Medium,
								'bg-red-500': task.priority === Priority.High,
							}"
						/>
						<SharedSelect
							v-else
							:placeholder="$t('SELECT_PRIORITY')"
							:options="PriorityOptions"
							v-model="selectedPriority"
						/>
					</li>
				</ul>
			</template>
			<template #footer>
				<div class="flex justify-between w-full">
					<Button variant="destructive" @click="deleteTask">
						{{ $t('REMOVE') }}
					</Button>
					<Button
						v-if="!detailsEdit"
						variant="outline"
						@click="startDetailsEdit"
					>
						{{ $t('EDIT') }}
					</Button>
					<Button
						v-else
						variant="outline"
						@click="saveTask"
					>
						{{ $t('SAVE') }}
					</Button>
				</div>
			</template>
			<template #triggerButton>
				<Button variant="outline" @click="cancelDraft">
					{{ $t('CLOSE') }}
				</Button>
			</template>
		</SharedModal>
		<div class="flex items-center justify-between gap-2" v-if="editName">
			<Input
				v-model="taskData.name"
				type="text"
				class="w-full h-6 dark:bg-white"
			/>
			<Icon
				icon="mdi:content-save"
				@click="saveTask"
			/>
		</div>
	</li>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import {
	performerList,
	PriorityOptions,
	responsiblePersonList,
} from '~/lib/constants';
import { Priority, type Task } from '~/stores/useProjectsStore';

const props = defineProps<{
	projectId: string;
	task: Task;
	sectionStatus: string;
}>();

const emit = defineEmits<{
	edit: [
		payload: {
			projectId: string;
			status: string;
			task: Task;
		},
	];
	delete: [
		payload: {
			projectId: string;
			status: string;
			taskId: string;
		},
	];
}>();

const createTaskDraft = (task: Task): Task => ({ ...task });

const taskData = ref<Task>(createTaskDraft(props.task));

const editName = ref<boolean>(false);
const detailsEdit = ref<boolean>(false);

watch(
	() => props.task,
	(task) => {
		if (!editName.value && !detailsEdit.value) {
			taskData.value = createTaskDraft(task);
		}
	},
	{ deep: true }
);

const selectedPriority = computed({
	get() {
		return taskData.value.priority;
	},
	set(priority: string) {
		taskData.value.priority = (priority || Priority.Low) as Priority;
	},
});

const startNameEdit = () => {
	taskData.value = createTaskDraft(props.task);
	editName.value = true;
};

const startDetailsEdit = () => {
	taskData.value = createTaskDraft(props.task);
	detailsEdit.value = true;
};

const cancelDraft = () => {
	taskData.value = createTaskDraft(props.task);
	editName.value = false;
	detailsEdit.value = false;
};

const saveTask = () => {
	const name = taskData.value.name.trim();
	const description = taskData.value.description.trim();

	if (!name || !description) {
		return;
	}

	emit('edit', {
		projectId: props.projectId,
		status: props.sectionStatus,
		task: {
			...taskData.value,
			status: props.sectionStatus,
			name,
			description,
			priority: taskData.value.priority || Priority.Low,
		},
	});
	editName.value = false;
	detailsEdit.value = false;
};

const deleteTask = () => {
	emit('delete', {
		projectId: props.projectId,
		status: props.sectionStatus,
		taskId: props.task.id,
	});
};
</script>
