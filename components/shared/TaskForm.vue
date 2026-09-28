<script setup lang="ts">
import { emptyTask, normalizeTask } from '~/lib/board';
import { PriorityOptions } from '~/lib/constants';
import type { TaskFields } from '~/types/board';
const props = defineProps<{ initialValue?: TaskFields; submitLabel: string }>();
const emit = defineEmits<{ submit: [fields: TaskFields]; cancel: [] }>();
const draft = reactive({ ...(props.initialValue ?? emptyTask()) });
const submitted = ref(false);
const uid = useId();
const errors = computed(() => ({
  name: submitted.value && !draft.name.trim(),
}));
function submit() {
  submitted.value = true;
  const fields = normalizeTask(draft);
  if (!fields) {
    nextTick(() => document.getElementById(`${uid}-name`)?.focus());
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
      <label :for="`${uid}-description`" class="field-label">{{
        $t('DESCRIPTION')
      }}</label>
      <Textarea
        :id="`${uid}-description`"
        v-model="draft.description"
        :placeholder="$t('DESCRIPTION_HINT')"
        rows="4"
      />
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label :for="`${uid}-performer`" class="field-label">{{
          $t('PERFORMER')
        }}</label
        ><Input
          :id="`${uid}-performer`"
          v-model="draft.performer"
          :placeholder="$t('PERSON_HINT')"
          maxlength="120"
        />
      </div>
      <div>
        <label :for="`${uid}-responsible`" class="field-label">{{
          $t('RESPONSIBLE_PERSON')
        }}</label>
        <Input
          :id="`${uid}-responsible`"
          v-model="draft.responsiblePerson"
          :placeholder="$t('PERSON_HINT')"
          maxlength="120"
        />
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
