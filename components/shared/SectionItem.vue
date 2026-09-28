<script setup lang="ts">
import draggable from 'vuedraggable';
import { Plus } from 'lucide-vue-next';
import { nanoid } from 'nanoid';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from '~/components/ui/dialog';
import { statusKeys } from '~/lib/board';
import type { Section, Task, TaskFields } from '~/types/board';
const props = defineProps<{ section: Section; projectId: string }>();
const store = useProjectsStore();
const open = ref(false);
const dragging = ref(false);
const tasks = computed<Task[]>({
  get: () => props.section.tasks,
  set: (tasks) =>
    store.setSectionTasks(props.projectId, props.section.status, tasks),
});
function addTask(fields: TaskFields) {
  store.addTask(props.projectId, props.section.status, {
    ...fields,
    id: nanoid(),
    status: props.section.status,
  });
  open.value = false;
}
</script>
<template>
  <section
    class="min-w-0 rounded-lg border bg-card p-4"
    :aria-label="$t(statusKeys[section.status])"
  >
    <header class="mb-4 flex items-center gap-2.5 px-1 pt-1">
      <span
        class="h-2 w-2 rounded-full"
        :class="{
          'bg-slate-400': section.status === 'TODO',
          'bg-amber-500': section.status === 'In progress',
          'bg-primary': section.status === 'Done',
        }"
      />
      <h2 class="text-sm font-semibold">
        {{ $t(statusKeys[section.status]) }}
      </h2>
      <span
        class="rounded bg-card px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground"
        >{{ tasks.length }}</span
      >
    </header>
    <div class="relative">
      <draggable
        v-model="tasks"
        :group="`tasks-${projectId}`"
        tag="ul"
        class="min-h-[48px] space-y-3"
        item-key="id"
        :animation="180"
        :delay="180"
        :delay-on-touch-only="true"
        :touch-start-threshold="5"
        filter="input, select, textarea"
        :prevent-on-filter="false"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element }"
          ><SharedTaskItem
            :task="element"
            :project-id="projectId"
            :section-status="section.status"
        /></template>
      </draggable>
      <div
        v-if="!tasks.length && !dragging"
        class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground"
      >
        {{ $t('EMPTY_COLUMN') }}
      </div>
    </div>
    <Dialog v-model:open="open">
      <DialogTrigger as-child
        ><Button
          variant="ghost"
          class="mt-3 w-full justify-start gap-2 text-muted-foreground"
          :aria-label="$t('ADD_TASK')"
          ><Plus class="h-4 w-4" />{{ $t('ADD_TASK') }}</Button
        ></DialogTrigger
      >
      <DialogContent
        ><DialogHeader
          ><DialogTitle>{{ $t('ADD_TASK') }}</DialogTitle
          ><DialogDescription>{{
            $t('ADD_TASK_DESCRIPTION', {
              status: $t(statusKeys[section.status]),
            })
          }}</DialogDescription></DialogHeader
        ><SharedTaskForm
          v-if="open"
          :submit-label="$t('ADD')"
          @submit="addTask"
          @cancel="open = false"
      /></DialogContent>
    </Dialog>
  </section>
</template>
