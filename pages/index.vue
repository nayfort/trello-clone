<script setup lang="ts">
import { Plus, FolderOpen } from 'lucide-vue-next';
const store = useProjectsStore();
const newProjectName = ref('');
function addProject() {
  if (!newProjectName.value.trim()) return;
  store.addProject(newProjectName.value);
  newProjectName.value = '';
}
</script>
<template>
  <header class="page-header">
    <h1 class="text-lg font-semibold">{{ $t('PROJECT_HEADER_TITLE') }}</h1>
  </header>
  <main class="mt-5">
    <form
      class="mb-6 flex flex-col gap-2 sm:flex-row"
      @submit.prevent="addProject"
    >
      <label for="new-project" class="sr-only">{{
        $t('ENTER_PROJECT_NAME')
      }}</label>
      <Input
        id="new-project"
        v-model="newProjectName"
        :placeholder="$t('ENTER_PROJECT_NAME')"
        required
        maxlength="120"
        class="bg-card"
      />
      <Button type="submit" class="gap-2"
        ><Plus class="h-4 w-4" />{{ $t('ADD_PROJECT') }}</Button
      >
    </form>
    <ul
      v-if="store.projects.length"
      class="max-w-2xl"
      :aria-label="$t('PROJECTS')"
    >
      <SharedProjectItem
        v-for="project in store.projects"
        :key="project.id"
        :project="project"
      />
    </ul>
    <div
      v-else
      class="flex max-w-2xl flex-col items-center rounded-lg border border-dashed px-6 py-12 text-center"
    >
      <FolderOpen class="mb-3 h-7 w-7 text-muted-foreground" />
      <p class="text-sm font-medium">{{ $t('NO_PROJECTS') }}</p>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ $t('CREATE_FIRST_PROJECT') }}
      </p>
    </div>
  </main>
</template>
