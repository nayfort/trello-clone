<script setup lang="ts">
import type { Activity } from '~/types/board';
const store = useProjectsStore();
const { data: items } = await useAsyncData('activity', () =>
  store.workspaceId
    ? useRequestFetch()<Activity[]>(
        `/api/workspaces/${store.workspaceId}/activity`,
      )
    : Promise.resolve([]),
);
const { locale } = useI18n();
</script>
<template>
  <header class="page-header">
    <h1 class="text-lg font-semibold">{{ $t('ACTIVITY') }}</h1>
  </header>
  <main class="mt-5">
    <ul v-if="items?.length" class="surface divide-y px-5">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex flex-wrap items-start justify-between gap-2 py-4"
      >
        <div>
          <p class="text-sm">
            <strong class="font-medium">{{ item.actorName }}</strong> ·
            {{ $t(`ACTION_${item.action.replaceAll('.', '_').toUpperCase()}`) }}
          </p>
          <p class="mt-1 break-words text-xs text-muted-foreground">
            {{ item.detail }}
          </p>
        </div>
        <time
          class="text-xs text-muted-foreground"
          :datetime="item.createdAt"
          >{{ new Date(item.createdAt).toLocaleString(locale) }}</time
        >
      </li>
    </ul>
    <p v-else class="text-sm text-muted-foreground">{{ $t('NO_ACTIVITY') }}</p>
  </main>
</template>
