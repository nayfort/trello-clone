<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '~/components/ui/dialog';
import { statusKeys } from '~/lib/board';
import {
  sectionStatuses,
  type Task,
  type TaskFields,
  type SectionStatus,
} from '~/types/board';
const props = defineProps<{
  projectId: string;
  task: Task;
  sectionStatus: SectionStatus;
}>();
const store = useProjectsStore();
const open = ref(false);
const editing = ref(false);
const confirming = ref(false);
const draftStatus = ref(props.sectionStatus);
const uid = useId();
const cardButton = ref<HTMLButtonElement>();
watch(open, (value) => {
  if (!value) {
    editing.value = false;
    nextTick(() => cardButton.value?.focus());
  }
});
function edit() {
  draftStatus.value = props.sectionStatus;
  editing.value = true;
}
function save(fields: TaskFields) {
  store.editTask({
    projectId: props.projectId,
    status: props.sectionStatus,
    task: { ...props.task, ...fields },
  });
  if (draftStatus.value !== props.sectionStatus) {
    open.value = false;
    store.moveTask(
      props.projectId,
      props.task.id,
      props.sectionStatus,
      draftStatus.value,
    );
  }
  editing.value = false;
}
function remove() {
  open.value = false;
  store.deleteTask({
    projectId: props.projectId,
    status: props.sectionStatus,
    taskId: props.task.id,
  });
}
</script>
<template>
  <li
    class="group flex cursor-grab items-center gap-2 rounded-md bg-slate-200 px-3 py-2.5 active:cursor-grabbing dark:bg-slate-700"
    :data-id="task.id"
  >
    <button
      ref="cardButton"
      type="button"
      class="min-w-0 flex-1 break-words rounded-sm text-left text-sm font-medium leading-relaxed [overflow-wrap:anywhere] hover:text-primary"
      @click="open = true"
    >
      {{ task.name }}
    </button>
    <button
      type="button"
      class="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
      :aria-label="$t('EDIT_TASK', { name: task.name })"
      @click="
        open = true;
        edit();
      "
    >
      <Pencil class="h-3.5 w-3.5" />
    </button>
    <Dialog v-model:open="open">
      <DialogContent>
        <DialogHeader
          ><DialogTitle>{{
            $t(editing ? 'EDIT_TASK_TITLE' : 'DETAILS')
          }}</DialogTitle
          ><DialogDescription>{{
            $t('TASK_DIALOG_DESCRIPTION')
          }}</DialogDescription></DialogHeader
        >
        <SharedTaskForm
          v-if="editing"
          :initial-value="task"
          :submit-label="$t('SAVE')"
          @submit="save"
          @cancel="editing = false"
        >
          <div>
            <label :for="`${uid}-status`" class="field-label">{{
              $t('STATUS')
            }}</label
            ><select
              :id="`${uid}-status`"
              v-model="draftStatus"
              class="native-select"
            >
              <option
                v-for="status in sectionStatuses"
                :key="status"
                :value="status"
              >
                {{ $t(statusKeys[status]) }}
              </option>
            </select>
          </div>
        </SharedTaskForm>
        <template v-else>
          <div class="flex items-center gap-2">
            <SharedPriorityBadge :priority="task.priority" /><span
              class="rounded-md bg-muted px-2 py-1 text-xs"
              >{{ $t(statusKeys[task.status]) }}</span
            >
          </div>
          <h3
            class="break-words text-xl font-semibold [overflow-wrap:anywhere]"
          >
            {{ task.name }}
          </h3>
          <p
            class="max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]"
          >
            {{ task.description }}
          </p>
          <dl class="grid grid-cols-2 gap-4 rounded-lg bg-muted/60 p-4 text-sm">
            <div>
              <dt class="mb-1 text-xs text-muted-foreground">
                {{ $t('PERFORMER') }}
              </dt>
              <dd>{{ task.performer || $t('UNASSIGNED') }}</dd>
            </div>
            <div>
              <dt class="mb-1 text-xs text-muted-foreground">
                {{ $t('RESPONSIBLE_PERSON') }}
              </dt>
              <dd>{{ task.responsiblePerson || $t('UNASSIGNED') }}</dd>
            </div>
          </dl>
          <div class="flex flex-wrap justify-between gap-2 border-t pt-4">
            <Button
              variant="ghost"
              class="text-destructive hover:bg-destructive/10 hover:text-destructive"
              @click="confirming = true"
              >{{ $t('REMOVE') }}</Button
            >
            <div class="flex gap-2">
              <Button variant="outline" @click="open = false">{{
                $t('CLOSE')
              }}</Button
              ><Button @click="edit"
                ><Pencil class="mr-2 h-3.5 w-3.5" />{{ $t('EDIT') }}</Button
              >
            </div>
          </div>
        </template>
      </DialogContent>
    </Dialog>
    <SharedConfirmDialog
      v-model:open="confirming"
      :title="$t('DELETE_TASK')"
      :description="$t('DELETE_TASK_DESCRIPTION', { name: task.name })"
      @confirm="remove"
    />
  </li>
</template>
