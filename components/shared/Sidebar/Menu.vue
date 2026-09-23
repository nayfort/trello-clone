<script setup lang="ts">
import { Folder, LayoutDashboard } from 'lucide-vue-next';
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
        v-for="item in [
          { href: '/', title: 'PROJECTS', icon: Folder },
          { href: '/dashboard', title: 'DASHBOARD', icon: LayoutDashboard },
        ]"
        :key="item.href"
        :to="localePath(item.href)"
        :aria-current="
          route.path === localePath(item.href) ? 'page' : undefined
        "
        class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        :class="
          route.path === localePath(item.href) &&
          'bg-secondary text-secondary-foreground'
        "
        @click="emit('close')"
        ><component :is="item.icon" class="h-[18px] w-[18px]" />{{
          $t(item.title)
        }}</NuxtLink
      >
    </nav>
  </div>
</template>
