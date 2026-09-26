<script setup lang="ts">
import { Plus, FolderOpen, Search } from 'lucide-vue-next';
const store = useProjectsStore();
const name = ref('');
const search = ref('');
const workspaceName = ref('');
const projects = computed(() =>
  store.projects.filter(
    (project) =>
      project.archived === store.showArchived &&
      project.name
        .toLocaleLowerCase()
        .includes(search.value.toLocaleLowerCase()),
  ),
);
async function add() {
  if (await store.addProject(name.value)) name.value = '';
}
</script>
<template>
  <header class="page-header gap-4">
    <div>
      <p class="mb-1 text-xs text-foreground/80">
        {{ store.workspace?.name || $t('WORKSPACE') }}
      </p>
      <h1 class="text-lg font-semibold">{{ $t('PROJECT_HEADER_TITLE') }}</h1>
    </div>
    <span
      v-if="store.workspace"
      class="rounded bg-card px-2 py-1 text-xs text-muted-foreground"
      >{{ $t(`ROLE_${store.workspace.role.toUpperCase()}`) }}</span
    >
  </header>
  <main class="mt-5">
    <div v-if="!store.workspaceId" class="surface mx-auto mt-10 max-w-xl p-8">
      <FolderOpen class="mb-4 h-8 w-8 text-primary" />
      <h2 class="text-xl font-semibold">{{ $t('WELCOME_WORKSPACE') }}</h2>
      <p class="my-4 text-sm leading-relaxed text-muted-foreground">
        {{ $t('WORKSPACE_DESCRIPTION') }}
      </p>
      <form
        class="space-y-3"
        @submit.prevent="store.createWorkspace(workspaceName)"
      >
        <label for="first-workspace" class="field-label">{{
          $t('WORKSPACE_NAME')
        }}</label
        ><Input
          id="first-workspace"
          v-model="workspaceName"
          required
          maxlength="120"
        /><Button :disabled="store.busy" type="submit">{{
          $t('CREATE_WORKSPACE')
        }}</Button>
      </form>
    </div>
    <template v-else>
      <form
        v-if="store.writable && !store.showArchived"
        class="mb-6 flex flex-col gap-2 sm:flex-row"
        @submit.prevent="add"
      >
        <label for="new-project" class="sr-only">{{
          $t('ENTER_PROJECT_NAME')
        }}</label
        ><Input
          id="new-project"
          v-model="name"
          :placeholder="$t('ENTER_PROJECT_NAME')"
          required
          maxlength="120"
          class="bg-card"
        /><Button type="submit" :disabled="store.busy" class="gap-2"
          ><Plus class="h-4 w-4" />{{ $t('ADD_PROJECT') }}</Button
        >
      </form>
      <SharedDataTransfer class="mb-6" />
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex rounded-lg bg-muted p-1">
          <button
            v-for="archived in [false, true]"
            :key="String(archived)"
            class="rounded-md px-3 py-1.5 text-sm"
            :class="store.showArchived === archived && 'bg-card shadow-sm'"
            :aria-pressed="store.showArchived === archived"
            @click="store.showArchived = archived"
          >
            {{ $t(archived ? 'ARCHIVED' : 'ACTIVE') }}
          </button>
        </div>
        <div class="relative w-full sm:w-64">
          <Search
            class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
          /><Input
            v-model="search"
            :aria-label="$t('SEARCH_PROJECTS')"
            :placeholder="$t('SEARCH_PROJECTS')"
            class="pl-9"
            type="search"
          />
        </div>
      </div>
      <ul
        v-if="projects.length"
        class="divide-y rounded-lg border bg-card px-4"
        :aria-label="$t('PROJECTS')"
      >
        <SharedProjectItem
          v-for="project in projects"
          :key="project.id"
          :project="project"
        />
      </ul>
      <div
        v-else
        class="rounded-lg border border-dashed px-6 py-12 text-center"
      >
        <FolderOpen class="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
        <p class="text-sm font-medium">
          {{ $t(search ? 'NO_RESULTS' : 'NO_PROJECTS') }}
        </p>
      </div>
    </template>
  </main>
</template>
