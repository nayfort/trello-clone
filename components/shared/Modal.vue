<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
const props = defineProps({
	title: { type: String, default: '' },
	locked: { type: Boolean, default: false },
	triggerLabel: { type: String, default: '' },
});

const emit = defineEmits<{ close: [] }>();
const isOpen = ref(false);

watch(isOpen, (open) => {
	if (!open) emit('close');
});

const closeDialog = async () => {
	await nextTick();
	if (!props.locked) {
		isOpen.value = false;
	}
};
</script>

<template>
	<Dialog v-model:open="isOpen">
		<DialogTrigger
			class="w-full flex justify-end"
			:aria-label="triggerLabel || undefined"
		>
			<slot name="trigger" />
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{{ title }}</DialogTitle>
				<slot name="header" />
			</DialogHeader>
			<DialogDescription>
				<slot name="description" />
			</DialogDescription>

			<div>
				<slot name="content" />
			</div>

			<DialogFooter class="flex-col items-center gap-2">
				<slot name="footer" />
				<div @click="closeDialog">
					<slot name="triggerButton" />
				</div>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
