<script setup lang="ts">
import { ArrowLeft, FolderSearch } from 'lucide-vue-next';
const store = useProjectsStore();
const route = useRoute();
const localePath = useLocalePath();
const project = computed(() => store.getProject(String(route.params.id ?? '')));
useHead({
  title: computed(() =>
    project.value ? `${project.value.name} · Trello Clone` : 'Trello Clone',
  ),
});
</script>
<template>
  <template v-if="project">
    <header class="page-header">
      <h1
        class="min-w-0 break-words text-lg font-semibold [overflow-wrap:anywhere]"
      >
        {{ $t('PROJECT_TASKS', { name: project.name }) }}
      </h1>
    </header>
    <main
      class="mt-5 grid items-start gap-4 md:grid-cols-3"
      :aria-label="$t('PROJECT_BOARD')"
    >
      <SharedSectionItem
        v-for="section in project.dashboard"
        :key="section.status"
        :section="section"
        :project-id="project.id"
      />
    </main>
  </template>
  <div v-else class="py-20 text-center">
    <FolderSearch class="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
    <h1 class="text-lg font-semibold">{{ $t('PROJECT_NOT_FOUND') }}</h1>
    <NuxtLink
      :to="localePath('/')"
      class="mt-4 inline-flex items-center gap-2 rounded p-2 text-sm text-primary hover:underline"
      ><ArrowLeft class="h-4 w-4" />{{ $t('GOTO_PROJECTS') }}</NuxtLink
    >
  </div>
</template>
