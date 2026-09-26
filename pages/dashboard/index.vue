<script setup lang="ts">
import { statusKeys } from '~/lib/board';
import { sectionStatuses } from '~/types/board';
const store = useProjectsStore();
const localePath = useLocalePath();
const counts = computed(() =>
  sectionStatuses.map((status) => ({
    status,
    count: store.projects
      .filter((project) => !project.archived)
      .reduce(
        (sum, project) =>
          sum +
          (project.dashboard.find((section) => section.status === status)?.tasks
            .length ?? 0),
        0,
      ),
  })),
);
const due = computed(() =>
  store.projects
    .filter((project) => !project.archived)
    .flatMap((project) =>
      project.dashboard
        .filter((section) => section.status !== 'Done')
        .flatMap((section) =>
          section.tasks
            .filter((task) => task.dueDate)
            .map((task) => ({
              ...task,
              boardId: project.id,
              boardName: project.name,
            })),
        ),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 12),
);
</script>
<template>
  <header class="page-header">
    <h1 class="text-lg font-semibold">{{ $t('DASHBOARD') }}</h1>
  </header>
  <main class="mt-6">
    <div class="grid grid-cols-3 gap-3">
      <div v-for="item in counts" :key="item.status" class="surface p-5">
        <p class="text-xs text-muted-foreground">
          {{ $t(statusKeys[item.status]) }}
        </p>
        <p class="mt-3 text-3xl font-semibold tabular-nums">{{ item.count }}</p>
      </div>
    </div>
    <h2 class="mb-4 mt-8 font-semibold">{{ $t('UPCOMING_TASKS') }}</h2>
    <ul v-if="due.length" class="surface divide-y px-5">
      <li
        v-for="task in due"
        :key="`${task.boardId}-${task.id}`"
        class="flex items-center justify-between gap-4 py-4"
      >
        <div>
          <NuxtLink
            :to="localePath(`/dashboard/${task.boardId}`)"
            class="text-sm font-medium hover:text-primary"
            >{{ task.name }}</NuxtLink
          >
          <p class="mt-1 text-xs text-muted-foreground">{{ task.boardName }}</p>
        </div>
        <span class="text-xs tabular-nums">{{ task.dueDate }}</span>
      </li>
    </ul>
    <p v-else class="text-sm text-muted-foreground">
      {{ $t('NO_UPCOMING_TASKS') }}
    </p>
  </main>
</template>
