<script setup lang="ts">
import { ArrowLeft, Columns3 } from 'lucide-vue-next';
const localePath = useLocalePath();
const route = useRoute();
const isProjectList = computed(
  () => route.path.replace(/\/$/, '') === localePath('/').replace(/\/$/, ''),
);
</script>

<template>
  <header class="border-b bg-card">
    <div
      class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
    >
      <NuxtLink
        :to="localePath('/')"
        class="flex items-center gap-2 rounded text-sm font-semibold"
        :aria-label="isProjectList ? 'Trello Clone' : $t('GOTO_PROJECTS')"
      >
        <Columns3 v-if="isProjectList" class="h-5 w-5 text-primary" />
        <ArrowLeft v-else class="h-5 w-5 text-primary" />
        <span>{{ isProjectList ? 'Trello Clone' : $t('PROJECTS') }}</span>
      </NuxtLink>
      <div class="flex items-center gap-2">
        <SharedColorModeToggle />
        <SharedLanguageToggle />
      </div>
    </div>
  </header>
</template>
