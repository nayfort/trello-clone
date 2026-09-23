<script setup lang="ts">
import { emptyTask, normalizeTask } from '~/lib/board';
import {
  performerList,
  responsiblePersonList,
  PriorityOptions,
} from '~/lib/constants';
import type { TaskFields } from '~/types/board';
const props = defineProps<{ initialValue?: TaskFields; submitLabel: string }>();
const emit = defineEmits<{ submit: [fields: TaskFields]; cancel: [] }>();
const draft = reactive({ ...(props.initialValue ?? emptyTask()) });
const submitted = ref(false);
const uid = useId();
const errors = computed(() => ({
  name: submitted.value && !draft.name.trim(),
  description: submitted.value && !draft.description.trim(),
}));
function submit() {
  submitted.value = true;
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
          <option v-for="person in performerList" :key="person" :value="person">
            {{ person }}
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
            v-for="person in responsiblePersonList"
            :key="person"
            :value="person"
          >
            {{ person }}
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
      <slot />
    </div>
    <div class="flex justify-end gap-2 border-t pt-5">
      <Button type="button" variant="outline" @click="emit('cancel')">{{
        $t('CANCEL')
      }}</Button
      ><Button type="submit">{{ submitLabel }}</Button>
    </div>
  </form>
</template>
