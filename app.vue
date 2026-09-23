<template>
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <ClientOnly>
      <div
        v-if="storageIssue"
        role="alert"
        class="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
      >
        {{
          $t(storageIssue === 'read' ? 'STORAGE_READ_ERROR' : 'STORAGE_ERROR')
        }}
      </div>
      <NuxtPage />
    </ClientOnly>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { storageIssue } from '~/lib/projectStorage';
useHead({
  title: 'Trello Clone',
});

const dashboardStore = useProjectsStore();
onMounted(() => dashboardStore.init());
</script>
