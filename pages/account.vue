<script setup lang="ts">
import { authClient } from '~/lib/auth-client';
const user = useCurrentUser();
const name = ref(user.value?.name ?? '');
const currentPassword = ref('');
const newPassword = ref('');
const store = useProjectsStore();
const message = ref('');
const { t } = useI18n();
const sessions = ref<
  {
    token: string;
    userAgent?: string | null;
    createdAt: Date;
    expiresAt: Date;
  }[]
>([]);
async function loadSessions() {
  const result = await authClient.listSessions();
  if (result.data) sessions.value = result.data;
}
onMounted(loadSessions);
async function profile() {
  const result = await store.request(() =>
    authClient.updateUser({ name: name.value }),
  );
  if (result?.error) store.error = result.error.message || t('AUTH_FAILED');
  else if (result && user.value) {
    user.value.name = name.value;
    message.value = t('SAVED');
  }
}
async function password() {
  const result = await store.request(() =>
    authClient.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      revokeOtherSessions: true,
    }),
  );
  if (result?.error) store.error = result.error.message || t('AUTH_FAILED');
  else if (result) {
    currentPassword.value = '';
    newPassword.value = '';
    message.value = t('PASSWORD_UPDATED');
    await loadSessions();
  }
}
async function revoke() {
  const result = await store.request(() => authClient.revokeOtherSessions());
  if (result?.error) store.error = result.error.message || t('AUTH_FAILED');
  else if (result) {
    await loadSessions();
    message.value = t('SESSIONS_REVOKED');
  }
}
</script>
<template>
  <header class="page-header">
    <h1 class="text-lg font-semibold">{{ $t('ACCOUNT') }}</h1>
  </header>
  <main class="mt-6 grid items-start gap-6 xl:grid-cols-2">
    <section class="surface p-6">
      <h2 class="mb-5 font-semibold">{{ $t('PROFILE') }}</h2>
      <form class="space-y-4" @submit.prevent="profile">
        <div>
          <label for="profile-name" class="field-label">{{ $t('NAME') }}</label
          ><Input
            id="profile-name"
            v-model="name"
            required
            maxlength="120"
            autocomplete="name"
          />
        </div>
        <div>
          <label for="profile-email" class="field-label">{{
            $t('EMAIL')
          }}</label
          ><Input id="profile-email" :model-value="user?.email" readonly />
        </div>
        <Button type="submit" :disabled="store.busy">{{ $t('SAVE') }}</Button>
      </form>
      <p v-if="message" role="status" class="mt-4 text-sm text-primary">
        {{ message }}
      </p>
    </section>
    <section class="surface p-6">
      <h2 class="mb-5 font-semibold">{{ $t('CHANGE_PASSWORD') }}</h2>
      <form class="space-y-4" @submit.prevent="password">
        <div>
          <label for="current-password" class="field-label">{{
            $t('CURRENT_PASSWORD')
          }}</label
          ><Input
            id="current-password"
            v-model="currentPassword"
            type="password"
            required
            autocomplete="current-password"
          />
        </div>
        <div>
          <label for="new-password" class="field-label">{{
            $t('NEW_PASSWORD')
          }}</label
          ><Input
            id="new-password"
            v-model="newPassword"
            type="password"
            required
            minlength="12"
            maxlength="128"
            autocomplete="new-password"
          />
          <p class="mt-2 text-xs text-muted-foreground">
            {{ $t('PASSWORD_HINT') }}
          </p>
        </div>
        <Button type="submit" :disabled="store.busy">{{
          $t('CHANGE_PASSWORD')
        }}</Button>
      </form>
    </section>
    <section class="surface p-6 xl:col-span-2">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-semibold">
          {{ $t('ACTIVE_SESSIONS') }} · {{ sessions.length }}
        </h2>
        <Button variant="outline" :disabled="store.busy" @click="revoke">{{
          $t('REVOKE_OTHER_SESSIONS')
        }}</Button>
      </div>
      <ul class="mt-3 divide-y">
        <li
          v-for="session in sessions"
          :key="session.token"
          class="break-words py-3 text-xs text-muted-foreground"
        >
          {{ session.userAgent || $t('UNKNOWN_DEVICE')
          }}<span class="mt-1 block"
            >{{ $t('EXPIRES') }}
            {{ new Date(session.expiresAt).toLocaleDateString() }}</span
          >
        </li>
      </ul>
    </section>
  </main>
</template>
