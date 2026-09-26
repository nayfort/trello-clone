<script setup lang="ts">
import { ArrowLeft, FolderSearch, Search, RefreshCw } from 'lucide-vue-next';
import type { Project } from '~/types/board';
const store = useProjectsStore();
const route = useRoute();
const localePath = useLocalePath();
const id = String(route.params.id ?? '');
if (!store.getProject(id)) {
  try {
    const board = await useRequestFetch()<Project>(`/api/boards/${id}`);
    store.workspaceId = board.workspaceId;
    await store.load(
      import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    );
  } catch {}
}
const project = computed(() => store.getProject(String(route.params.id ?? '')));
const count = computed(
  () =>
    project.value?.dashboard.reduce(
      (sum, section) => sum + section.tasks.length,
      0,
    ) ?? 0,
);
const user = useCurrentUser();
useHead({
  title: computed(() =>
    project.value ? `${project.value.name} · Trello Clone` : 'Trello Clone',
  ),
});
onBeforeUnmount(() => {
  store.search = '';
  store.priorityFilter = '';
  store.assigneeFilter = '';
});
</script>
<template>
  <template v-if="project"
    ><NuxtLink
      :to="localePath('/')"
      class="mb-4 inline-flex items-center gap-2 rounded text-xs text-muted-foreground hover:text-primary"
      ><ArrowLeft class="h-3 w-3" />{{ $t('GOTO_PROJECTS') }}</NuxtLink
    >
    <header class="page-header gap-4">
      <div class="min-w-0">
        <h1 class="break-words text-lg font-semibold">{{ project.name }}</h1>
        <p class="mt-1 text-xs text-foreground/80">
          {{ store.workspace?.name }} · {{ $t('TASK_COUNT', { count }) }}
        </p>
      </div>
      <span
        class="shrink-0 rounded bg-card px-2 py-1 text-xs text-muted-foreground"
        role="status"
        >{{
          $t(
            store.error
              ? 'SYNC_ERROR'
              : store.busy
                ? 'SAVING'
                : project.archived
                  ? 'ARCHIVED'
                  : store.writable
                    ? 'SYNCED'
                    : 'READ_ONLY',
          )
        }}</span
      >
    </header>
    <div class="my-5 flex flex-wrap gap-2">
      <div class="relative min-w-[160px] flex-1">
        <Search
          class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
        /><Input
          v-model="store.search"
          :aria-label="$t('SEARCH_TASKS')"
          :placeholder="$t('SEARCH_TASKS')"
          class="pl-9"
          type="search"
        />
      </div>
      <select
        v-model="store.priorityFilter"
        :aria-label="$t('PRIORITY')"
        class="native-select w-auto"
      >
        <option value="">{{ $t('ALL_PRIORITIES') }}</option>
        <option
          v-for="priority in ['low', 'medium', 'high']"
          :key="priority"
          :value="priority"
        >
          {{ $t(priority.toUpperCase()) }}
        </option></select
      ><select
        v-model="store.assigneeFilter"
        :aria-label="$t('PERFORMER')"
        class="native-select w-auto max-w-[180px]"
      >
        <option value="">{{ $t('ALL_MEMBERS') }}</option>
        <option
          v-for="member in store.members"
          :key="member.id"
          :value="member.id"
        >
          {{ member.name
          }}{{ member.id === user?.id ? ' (' + $t('YOU') + ')' : '' }}
        </option></select
      ><Button
        variant="outline"
        size="icon"
        :disabled="store.busy || store.editLocks > 0"
        :aria-label="$t('REFRESH')"
        @click="store.refresh()"
        ><RefreshCw class="h-4 w-4"
      /></Button>
    </div>
    <p v-if="store.filtered" class="mb-3 text-xs text-muted-foreground">
      {{ $t('FILTER_DRAG_HINT') }}
    </p>
    <main
      class="grid items-start gap-4 md:grid-cols-3"
      :aria-label="$t('PROJECT_BOARD')"
    >
      <SharedSectionItem
        v-for="section in project.dashboard"
        :key="section.status"
        :section="section"
        :project-id="project.id"
      /></main
  ></template>
  <div v-else class="py-20 text-center">
    <FolderSearch class="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
    <h1 class="text-lg font-semibold">{{ $t('PROJECT_NOT_FOUND') }}</h1>
    <NuxtLink
      :to="localePath('/')"
      class="mt-4 inline-flex gap-2 text-sm text-primary"
      >{{ $t('GOTO_PROJECTS') }}</NuxtLink
    >
  </div>
</template>
