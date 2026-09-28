<script setup lang="ts">
import { Pencil, Check, Trash2, X } from 'lucide-vue-next';
import type { Project } from '~/types/board';
const props = defineProps<{ project: Project }>();
const store = useProjectsStore();
const localePath = useLocalePath();
const editing = ref(false);
const name = ref('');
const confirming = ref(false);
const nameInput = ref<{ $el: HTMLInputElement }>();
const editButton = ref<{ $el: HTMLButtonElement }>();
async function edit() {
  name.value = props.project.name;
  editing.value = true;
  await nextTick();
  nameInput.value?.$el.focus();
  nameInput.value?.$el.select();
}
async function cancel() {
  editing.value = false;
  await nextTick();
  editButton.value?.$el.focus();
}
function save() {
  if (!name.value.trim()) return;
  store.updateProjectName(props.project.id, name.value);
  cancel();
}
</script>
<template>
  <li class="flex min-w-0 items-center gap-2 border-b py-3">
    <form
      v-if="editing"
      class="flex min-w-0 flex-1 gap-1"
      @submit.prevent="save"
    >
      <Input
        ref="nameInput"
        v-model="name"
        :aria-label="$t('NAME')"
        required
        maxlength="120"
        @keydown.esc="cancel"
      />
      <Button type="submit" variant="ghost" size="icon" :aria-label="$t('SAVE')"
        ><Check class="h-4 w-4"
      /></Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        :aria-label="$t('CANCEL')"
        @click="cancel"
        ><X class="h-4 w-4"
      /></Button>
    </form>
    <template v-else>
      <NuxtLink
        :to="localePath(`/dashboard/${project.id}`)"
        class="min-w-0 flex-1 break-words rounded-sm py-2 text-sm font-medium [overflow-wrap:anywhere] hover:text-primary"
        >{{ project.name }}</NuxtLink
      >
      <Button
        ref="editButton"
        variant="ghost"
        size="icon"
        :aria-label="$t('EDIT')"
        @click="edit"
        ><Pencil class="h-4 w-4" /><span class="sr-only">{{
          $t('EDIT')
        }}</span></Button
      >
    </template>
    <Button
      variant="ghost"
      size="icon"
      class="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      :aria-label="$t('REMOVE')"
      @click="confirming = true"
      ><Trash2 class="h-4 w-4"
    /></Button>
    <SharedConfirmDialog
      v-model:open="confirming"
      :title="$t('DELETE_PROJECT')"
      :description="$t('DELETE_PROJECT_DESCRIPTION', { name: project.name })"
      @confirm="store.deleteProject(project.id)"
    />
  </li>
</template>
