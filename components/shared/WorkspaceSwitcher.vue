<script setup lang="ts">
import { Plus, Users } from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '~/components/ui/dialog';
const store = useProjectsStore();
const name = ref('');
const open = ref(false);
const uid = useId();
const localePath = useLocalePath();
async function create() {
  if (await store.createWorkspace(name.value)) {
    name.value = '';
    open.value = false;
    await navigateTo(localePath('/'));
  }
}
async function select(event: Event) {
  await store.selectWorkspace((event.target as HTMLSelectElement).value);
  await navigateTo(localePath('/'));
}
</script>
<template>
  <div class="px-3 pb-4">
    <label
      :for="uid"
      class="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      ><Users class="h-3.5 w-3.5" />{{ $t('WORKSPACE') }}</label
    >
    <div class="flex gap-1">
      <select
        v-if="store.workspaces.length"
        :id="uid"
        :value="store.workspaceId"
        class="native-select min-w-0 text-xs"
        :disabled="store.busy || store.editLocks > 0"
        @change="select"
      >
        <option
          v-for="workspace in store.workspaces"
          :key="workspace.id"
          :value="workspace.id"
        >
          {{ workspace.name }}
        </option></select
      ><Dialog v-model:open="open"
        ><DialogTrigger as-child
          ><Button
            variant="outline"
            :size="store.workspaces.length ? 'icon' : 'default'"
            :aria-label="$t('CREATE_WORKSPACE')"
            class="shrink-0"
            ><Plus class="h-4 w-4" /><span
              v-if="!store.workspaces.length"
              class="ml-2"
              >{{ $t('CREATE_WORKSPACE') }}</span
            ></Button
          ></DialogTrigger
        ><DialogContent
          ><DialogHeader
            ><DialogTitle>{{ $t('CREATE_WORKSPACE') }}</DialogTitle
            ><DialogDescription>{{
              $t('WORKSPACE_DESCRIPTION')
            }}</DialogDescription></DialogHeader
          >
          <form class="space-y-4" @submit.prevent="create">
            <label for="workspace-name" class="field-label">{{
              $t('NAME')
            }}</label
            ><Input
              id="workspace-name"
              v-model="name"
              required
              maxlength="120"
            /><Button type="submit" :disabled="store.busy">{{
              $t('CREATE_WORKSPACE')
            }}</Button>
          </form></DialogContent
        ></Dialog
      >
    </div>
  </div>
</template>
