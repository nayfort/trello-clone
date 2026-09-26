<script setup lang="ts">
import { apiFetch } from '~/lib/api';

import type { Member } from '~/types/board';
const store = useProjectsStore();
const user = useCurrentUser();
const email = ref('');
const role = ref('member');
const workspaceName = ref(store.workspace?.name ?? '');
const transferTo = ref('');
const notice = ref('');
const { t } = useI18n();
interface Team {
  members: Member[];
  invitations: { id: string; email: string; role: string; expiresAt: string }[];
}
const { data: team, refresh } = await useAsyncData('team', () =>
  store.workspaceId
    ? useRequestFetch()<Team>(`/api/workspaces/${store.workspaceId}`)
    : Promise.resolve({ members: [], invitations: [] }),
);
async function sendInvite() {
  const result = await store.request(() =>
    apiFetch(`/api/workspaces/${store.workspaceId}/invitations`, {
      method: 'POST',
      body: { email: email.value, role: role.value },
    }),
  );
  if (result) {
    email.value = '';
    notice.value = t('INVITATION_SENT');
    await refresh();
  }
}
async function memberChange(id: string, newRole: string | null) {
  if (
    await store.request(() =>
      apiFetch(`/api/workspaces/${store.workspaceId}/members`, {
        method: 'PATCH',
        body: { userId: id, role: newRole },
      }),
    )
  ) {
    await refresh();
    await store.load();
  }
}
async function revoke(id: string) {
  if (
    await store.request(() =>
      apiFetch(`/api/workspaces/${store.workspaceId}/invitations`, {
        method: 'DELETE',
        body: { invitationId: id },
      }),
    )
  )
    await refresh();
}
async function rename() {
  if (
    await store.request(() =>
      apiFetch(`/api/workspaces/${store.workspaceId}`, {
        method: 'PATCH',
        body: { name: workspaceName.value },
      }),
    )
  )
    await store.load();
}
async function transfer() {
  if (
    await store.request(() =>
      apiFetch(`/api/workspaces/${store.workspaceId}/transfer`, {
        method: 'POST',
        body: { userId: transferTo.value },
      }),
    )
  ) {
    await store.load();
    await refresh();
    transferTo.value = '';
  }
}
const removal = ref<Member | null>(null);
const confirmRemoval = computed({
  get: () => Boolean(removal.value),
  set: (value: boolean) => {
    if (!value) removal.value = null;
  },
});
const deletionName = ref('');
const leaving = ref(false);
const deleting = ref(false);
const localePath = useLocalePath();
async function depart(remove = false) {
  const result = await store.request(() =>
    apiFetch(`/api/workspaces/${store.workspaceId}${remove ? '' : '/leave'}`, {
      method: remove ? 'DELETE' : 'POST',
      body: remove ? { name: deletionName.value } : {},
    }),
  );
  if (result) {
    await store.load();
    await navigateTo(localePath('/'));
  }
}
const pendingRemovalId = ref('');
function askRemove(member: Member) {
  pendingRemovalId.value = member.id;
  removal.value = member;
}
</script>
<template>
  <header class="page-header">
    <h1 class="text-lg font-semibold">
      {{ $t('TEAM')
      }}<span v-if="store.workspace" class="font-normal text-muted-foreground">
        · {{ store.workspace.name }}</span
      >
    </h1>
  </header>
  <main v-if="store.workspaceId" class="mt-6 space-y-6">
    <section v-if="store.manageable" class="surface p-5">
      <h2 class="mb-4 font-semibold">{{ $t('INVITE_MEMBER') }}</h2>
      <form
        class="grid gap-3 sm:grid-cols-[1fr_160px_auto]"
        @submit.prevent="sendInvite"
      >
        <div>
          <label for="invite-email" class="sr-only">{{ $t('EMAIL') }}</label
          ><Input
            id="invite-email"
            v-model="email"
            type="email"
            required
            :placeholder="$t('EMAIL')"
          />
        </div>
        <select v-model="role" :aria-label="$t('ROLE')" class="native-select">
          <option value="member">{{ $t('ROLE_MEMBER') }}</option>
          <option value="viewer">{{ $t('ROLE_VIEWER') }}</option>
          <option v-if="store.workspace?.role === 'owner'" value="admin">
            {{ $t('ROLE_ADMIN') }}
          </option></select
        ><Button type="submit" :disabled="store.busy">{{
          $t('SEND_INVITATION')
        }}</Button>
      </form>
      <p v-if="notice" role="status" class="mt-3 text-sm text-primary">
        {{ notice }}
      </p>
    </section>
    <section class="surface overflow-hidden">
      <h2 class="border-b p-5 font-semibold">
        {{ $t('MEMBERS') }}
        <span class="text-muted-foreground">{{ team?.members.length }}</span>
      </h2>
      <ul class="divide-y px-5">
        <li
          v-for="member in team?.members"
          :key="member.id"
          class="flex flex-wrap items-center justify-between gap-3 py-4"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">
              {{ member.name
              }}<span
                v-if="member.id === user?.id"
                class="ml-2 text-xs text-muted-foreground"
                >{{ $t('YOU') }}</span
              >
            </p>
            <p class="break-all text-xs text-muted-foreground">
              {{ member.email }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <select
              v-if="
                store.manageable &&
                member.role !== 'owner' &&
                (store.workspace?.role === 'owner' || member.role !== 'admin')
              "
              :value="member.role"
              :aria-label="$t('ROLE_FOR', { name: member.name })"
              class="native-select w-32"
              :disabled="store.busy"
              @change="
                memberChange(
                  member.id,
                  ($event.target as HTMLSelectElement).value,
                )
              "
            >
              <option value="member">{{ $t('ROLE_MEMBER') }}</option>
              <option value="viewer">{{ $t('ROLE_VIEWER') }}</option>
              <option v-if="store.workspace?.role === 'owner'" value="admin">
                {{ $t('ROLE_ADMIN') }}
              </option></select
            ><span v-else class="rounded-md bg-muted px-2 py-1 text-xs">{{
              $t(`ROLE_${member.role.toUpperCase()}`)
            }}</span
            ><Button
              v-if="
                store.manageable &&
                member.role !== 'owner' &&
                (store.workspace?.role === 'owner' || member.role !== 'admin')
              "
              variant="ghost"
              size="sm"
              :disabled="store.busy"
              @click="askRemove(member)"
              >{{ $t('REMOVE') }}</Button
            >
          </div>
        </li>
      </ul>
    </section>
    <section v-if="team?.invitations.length" class="surface p-5">
      <h2 class="mb-3 font-semibold">{{ $t('PENDING_INVITATIONS') }}</h2>
      <ul class="divide-y">
        <li
          v-for="invitation in team.invitations"
          :key="invitation.id"
          class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
        >
          <span class="break-all"
            >{{ invitation.email }} ·
            {{ $t(`ROLE_${invitation.role.toUpperCase()}`) }}</span
          ><Button
            variant="outline"
            size="sm"
            :disabled="store.busy"
            @click="revoke(invitation.id)"
            >{{ $t('REVOKE') }}</Button
          >
        </li>
      </ul>
    </section>
    <section v-if="store.manageable" class="surface p-5">
      <h2 class="mb-4 font-semibold">{{ $t('WORKSPACE_SETTINGS') }}</h2>
      <form class="flex gap-2" @submit.prevent="rename">
        <Input
          v-model="workspaceName"
          required
          maxlength="120"
          :aria-label="$t('WORKSPACE_NAME')"
        /><Button type="submit" :disabled="store.busy">{{ $t('SAVE') }}</Button>
      </form>
      <form
        v-if="store.workspace?.role === 'owner'"
        class="mt-6 space-y-3 border-t pt-5"
        @submit.prevent="transfer"
      >
        <label for="transfer-owner" class="field-label">{{
          $t('TRANSFER_OWNERSHIP')
        }}</label>
        <p class="text-xs text-muted-foreground">
          {{ $t('TRANSFER_DESCRIPTION') }}
        </p>
        <div class="flex flex-col gap-2 sm:flex-row">
          <select
            id="transfer-owner"
            v-model="transferTo"
            required
            class="native-select"
          >
            <option value="" disabled>{{ $t('SELECT_MEMBER') }}</option>
            <option
              v-for="member in team?.members.filter(
                (item) => item.id !== user?.id,
              )"
              :key="member.id"
              :value="member.id"
            >
              {{ member.name }}
            </option></select
          ><Button
            type="submit"
            variant="outline"
            :disabled="store.busy || !transferTo"
            >{{ $t('TRANSFER_OWNERSHIP') }}</Button
          >
        </div>
      </form>
    </section>
    <section class="surface p-5">
      <h2 class="font-semibold">{{ $t('WORKSPACE_ACCESS') }}</h2>
      <template v-if="store.workspace?.role === 'owner'"
        ><p class="my-3 text-sm text-muted-foreground">
          {{ $t('DELETE_WORKSPACE_DESCRIPTION') }}
        </p>
        <label for="delete-workspace-name" class="field-label">{{
          $t('WORKSPACE_NAME')
        }}</label>
        <div class="flex flex-col gap-2 sm:flex-row">
          <Input
            id="delete-workspace-name"
            v-model="deletionName"
            :placeholder="store.workspace.name"
          /><Button
            variant="destructive"
            :disabled="store.busy || deletionName !== store.workspace.name"
            @click="deleting = true"
            >{{ $t('DELETE_WORKSPACE') }}</Button
          >
        </div></template
      ><Button
        v-else
        class="mt-3"
        variant="outline"
        :disabled="store.busy"
        @click="leaving = true"
        >{{ $t('LEAVE_WORKSPACE') }}</Button
      >
    </section>
    <SharedConfirmDialog
      v-model:open="deleting"
      :title="$t('DELETE_WORKSPACE')"
      :description="$t('DELETE_WORKSPACE_DESCRIPTION')"
      @confirm="depart(true)"
    />
    <SharedConfirmDialog
      v-model:open="leaving"
      :title="$t('LEAVE_WORKSPACE')"
      :description="$t('LEAVE_WORKSPACE_DESCRIPTION')"
      @confirm="depart()"
    />
    <SharedConfirmDialog
      v-model:open="confirmRemoval"
      :title="$t('REMOVE_MEMBER')"
      :description="
        $t('REMOVE_MEMBER_DESCRIPTION', { name: removal?.name ?? '' })
      "
      @confirm="memberChange(pendingRemovalId, null)"
    />
  </main>
  <p v-else class="mt-6 text-sm text-muted-foreground">
    {{ $t('WORKSPACE_DESCRIPTION') }}
  </p>
</template>
