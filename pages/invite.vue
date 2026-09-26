<script setup lang="ts">
import { apiFetch } from '~/lib/api';

const user = useCurrentUser();
const route = useRoute();
const store = useProjectsStore();
const localePath = useLocalePath();
const accepted = ref(false);
async function accept() {
  const result = await store.request(() =>
    apiFetch<{ workspaceId: string }>('/api/invitations/accept', {
      method: 'POST',
      body: { token: String(route.query.token ?? '') },
    }),
  );
  if (result) {
    accepted.value = true;
    store.workspaceId = result.workspaceId;
    await store.load();
    await navigateTo(localePath('/'));
  }
}
</script>
<template>
  <div class="surface mx-auto mt-10 max-w-lg p-8">
    <h1 class="text-2xl font-semibold">{{ $t('TEAM_INVITATION') }}</h1>
    <p class="my-4 text-sm text-muted-foreground">
      {{ $t('INVITATION_DESCRIPTION') }} {{ user?.email }}
    </p>
    <Button :disabled="store.busy || accepted" @click="accept">{{
      $t('ACCEPT_INVITATION')
    }}</Button>
  </div>
</template>
