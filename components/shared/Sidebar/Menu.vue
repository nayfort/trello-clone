<script setup lang="ts">
import {
  Folder,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Activity,
} from 'lucide-vue-next';
import { authClient } from '~/lib/auth-client';
const localePath = useLocalePath();
const route = useRoute();
const store = useProjectsStore();
const user = useCurrentUser();
const emit = defineEmits<{ close: [] }>();
const links = [
  { href: '/', title: 'PROJECTS', icon: Folder },
  { href: '/dashboard', title: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/team', title: 'TEAM', icon: Users },
  { href: '/activity', title: 'ACTIVITY', icon: Activity },
  { href: '/account', title: 'ACCOUNT', icon: Settings },
];
async function logout() {
  const result = await authClient.signOut();
  if (result.error) {
    store.error = result.error.message || 'Sign out failed';
    return;
  }
  store.$reset();
  user.value = null;
  emit('close');
  await navigateTo(localePath('/login'));
}
</script>
<template>
  <div class="flex h-full flex-col">
    <header class="px-5 py-6">
      <NuxtLink
        :to="localePath('/')"
        class="rounded text-base font-semibold"
        @click="emit('close')"
        >Trello Clone<span class="text-primary">.</span></NuxtLink
      >
      <p class="mt-1 text-xs text-muted-foreground">
        {{ $t('TEAM_WORKSPACE') }}
      </p>
    </header>
    <SharedWorkspaceSwitcher />
    <nav :aria-label="$t('WORKSPACE')" class="space-y-1 px-3">
      <NuxtLink
        v-for="item in links"
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
    <div class="mt-auto px-5 pt-8 pb-4">
      <p class="truncate text-sm font-medium">{{ user?.name }}</p>
      <p class="mb-3 truncate text-xs text-muted-foreground">
        {{ user?.email }}
      </p>
      <button
        type="button"
        class="flex items-center gap-2 rounded text-xs text-muted-foreground hover:text-foreground"
        @click="logout"
      >
        <LogOut class="h-3.5 w-3.5" />{{ $t('SIGN_OUT') }}
      </button>
    </div>
  </div>
</template>
