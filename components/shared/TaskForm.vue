<script setup lang="ts">
import { emptyTask, normalizeTask } from '~/lib/board';
import { PriorityOptions } from '~/lib/constants';
import { nanoid } from 'nanoid';
import type { TaskFields } from '~/types/board';
const props = defineProps<{ initialValue?: TaskFields; submitLabel: string }>();
const emit = defineEmits<{ submit: [fields: TaskFields]; cancel: [] }>();
const store = useProjectsStore();
const draft = reactive(
  JSON.parse(JSON.stringify(props.initialValue ?? emptyTask())) as TaskFields,
);
const labels = ref(draft.labels.join(', '));
const checklistText = ref('');
function addChecklist() {
  if (checklistText.value.trim()) {
    draft.checklist.push({
      id: nanoid(),
      text: checklistText.value.trim(),
      done: false,
    });
    checklistText.value = '';
  }
}
const submitted = ref(false);
const uid = useId();
const errors = computed(() => ({
  name: submitted.value && !draft.name.trim(),
  description: submitted.value && !draft.description.trim(),
}));
function submit() {
  submitted.value = true;
  draft.labels = [
    ...new Set(
      labels.value
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
    ),
  ].slice(0, 10);
  const fields = normalizeTask(draft);
  if (!fields) {
    nextTick(() =>
      document
        .getElementById(`${uid}-${errors.value.name ? 'name' : 'description'}`)
        ?.focus(),
    );
    return;
  }
  emit('submit', fields);
}
</script>
<template>
  <form novalidate class="space-y-5" @submit.prevent="submit">
    <div>
      <label :for="`${uid}-name`" class="field-label"
        >{{ $t('NAME') }} <span class="text-muted-foreground">*</span></label
      ><Input
        :id="`${uid}-name`"
        v-model="draft.name"
        :placeholder="`${$t('NAME')}*`"
        required
        maxlength="200"
        :aria-invalid="errors.name"
        :aria-describedby="errors.name ? `${uid}-name-error` : undefined"
        :class="errors.name && 'border-destructive'"
      />
      <p
        v-if="errors.name"
        :id="`${uid}-name-error`"
        class="mt-1.5 text-xs text-destructive"
      >
        {{ $t('NAME_REQUIRED') }}
      </p>
    </div>
    <div>
      <label :for="`${uid}-description`" class="field-label"
        >{{ $t('DESCRIPTION') }}
        <span class="text-muted-foreground">*</span></label
      ><Textarea
        :id="`${uid}-description`"
        v-model="draft.description"
        :placeholder="`${$t('DESCRIPTION')}*`"
        required
        rows="4"
        :aria-invalid="errors.description"
        :aria-describedby="
          errors.description ? `${uid}-description-error` : undefined
        "
        :class="errors.description && 'border-destructive'"
      />
      <p
        v-if="errors.description"
        :id="`${uid}-description-error`"
        class="mt-1.5 text-xs text-destructive"
      >
        {{ $t('DESCRIPTION_REQUIRED') }}
      </p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="`${uid}-performer`" class="field-label">{{
          $t('PERFORMER')
        }}</label
        ><select
          :id="`${uid}-performer`"
          v-model="draft.performer"
          class="native-select"
        >
          <option value="">{{ $t('UNASSIGNED') }}</option>
          <option
            v-for="person in store.members"
            :key="person.id"
            :value="person.id"
          >
            {{ person.name }}
          </option>
        </select>
      </div>
      <div>
        <label :for="`${uid}-responsible`" class="field-label">{{
          $t('RESPONSIBLE_PERSON')
        }}</label
        ><select
          :id="`${uid}-responsible`"
          v-model="draft.responsiblePerson"
          class="native-select"
        >
          <option value="">{{ $t('UNASSIGNED') }}</option>
          <option
            v-for="person in store.members"
            :key="person.id"
            :value="person.id"
          >
            {{ person.name }}
          </option>
        </select>
      </div>
      <div>
        <label :for="`${uid}-priority`" class="field-label">{{
          $t('PRIORITY')
        }}</label
        ><select
          :id="`${uid}-priority`"
          v-model="draft.priority"
          class="native-select"
        >
          <option
            v-for="priority in PriorityOptions"
            :key="priority"
            :value="priority"
          >
            {{ $t(priority.toUpperCase()) }}
          </option>
        </select>
      </div>
      <div>
        <label :for="`${uid}-due`" class="field-label">{{
          $t('DUE_DATE')
        }}</label
        ><Input :id="`${uid}-due`" v-model="draft.dueDate" type="date" />
      </div>
      <slot />
    </div>
    <div>
      <label :for="`${uid}-labels`" class="field-label">{{
        $t('LABELS')
      }}</label
      ><Input
        :id="`${uid}-labels`"
        v-model="labels"
        :placeholder="$t('LABELS_HINT')"
        maxlength="310"
      />
    </div>
    <div>
      <label :for="`${uid}-checklist`" class="field-label">{{
        $t('CHECKLIST')
      }}</label>
      <ul class="mb-3 space-y-2">
        <li
          v-for="(item, index) in draft.checklist"
          :key="item.id"
          class="flex items-center gap-2"
        >
          <input
            :id="item.id"
            v-model="item.done"
            type="checkbox"
            class="h-4 w-4 accent-blue-600"
          /><label :for="item.id" class="flex-1 break-words text-sm">{{
            item.text
          }}</label
          ><button
            type="button"
            :aria-label="$t('REMOVE_CHECKLIST_ITEM', { name: item.text })"
            class="rounded px-2 text-muted-foreground"
            @click="draft.checklist.splice(index, 1)"
          >
            ×
          </button>
        </li>
      </ul>
      <div class="flex gap-2">
        <Input
          :id="`${uid}-checklist`"
          v-model="checklistText"
          maxlength="300"
          @keydown.enter.prevent="addChecklist"
        /><Button
          type="button"
          variant="outline"
          :disabled="!checklistText.trim() || draft.checklist.length >= 100"
          @click="addChecklist"
          >{{ $t('ADD') }}</Button
        >
      </div>
    </div>
    <div class="flex justify-end gap-2 border-t pt-5">
      <Button type="button" variant="outline" @click="emit('cancel')">{{
        $t('CANCEL')
      }}</Button
      ><Button type="submit" :disabled="store.busy">{{ submitLabel }}</Button>
    </div>
  </form>
</template>
