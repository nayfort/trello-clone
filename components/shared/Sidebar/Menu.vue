<script setup lang="ts">
import { Folder } from 'lucide-vue-next';
const localePath = useLocalePath();
const route = useRoute();
const emit = defineEmits<{ close: [] }>();
</script>
<template>
  <div>
    <header class="px-5 py-6">
      <NuxtLink
        :to="localePath('/')"
        class="rounded text-base font-semibold"
        @click="emit('close')"
        >Trello Clone</NuxtLink
      >
    </header>
    <nav :aria-label="$t('WORKSPACE')" class="space-y-1 px-3">
      <NuxtLink
        :to="localePath('/')"
        :aria-current="route.path === localePath('/') ? 'page' : undefined"
        class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        :class="
          route.path === localePath('/') &&
          'bg-secondary text-secondary-foreground'
        "
        @click="emit('close')"
        ><Folder class="h-[18px] w-[18px]" />{{ $t('PROJECTS') }}</NuxtLink
      >
    </nav>
  </div>
</template>
