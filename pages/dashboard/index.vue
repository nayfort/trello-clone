<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
const localePath = useLocalePath();
</script>
<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <NuxtLink
      :to="localePath('/')"
      class="inline-flex items-center gap-2 rounded-md p-3 text-lg font-medium text-primary hover:underline"
      ><ArrowLeft class="h-5 w-5" />{{ $t('GOTO_PROJECTS') }}</NuxtLink
    >
  </div>
</template>
