<script setup lang="ts">
import type { Priority } from '~/types/board';
defineProps<{ priority: Priority }>();
</script>
<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold"
    :class="{
      'bg-sky-500/10 text-sky-700 dark:text-sky-300': priority === 'low',
      'bg-amber-500/10 text-amber-700 dark:text-amber-300':
        priority === 'medium',
      'bg-rose-500/10 text-rose-700 dark:text-rose-300': priority === 'high',
    }"
    ><span class="h-1 w-1 rounded-full bg-current" />{{
      $t(priority.toUpperCase())
    }}</span
  >
</template>
