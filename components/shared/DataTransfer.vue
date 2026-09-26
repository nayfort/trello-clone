<script setup lang="ts">
import { Download, Upload } from 'lucide-vue-next';
const store = useProjectsStore();
const { t } = useI18n();
const input = ref<HTMLInputElement>();
const message = ref('');
const legacy = ref<unknown[] | null>(null);
onMounted(() => {
  try {
    const raw = localStorage.getItem('projects-store');
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.projects) && data.projects.length)
        legacy.value = data.projects;
    }
  } catch {
    store.error = t('IMPORT_INVALID');
  }
});
async function importData(projects: unknown) {
  const result = await store.importProjects(projects);
  if (result) {
    message.value = t('IMPORTED_COUNT', { count: result.count });
    legacy.value = null;
  }
}
async function readFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error();
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.projects)) throw new Error();
    await importData(data.projects);
  } catch {
    store.error = t('IMPORT_INVALID');
  } finally {
    if (input.value) input.value.value = '';
  }
}
function download() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          projects: store.projects,
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trello-workspace.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>
<template>
  <div>
    <div
      v-if="legacy && store.writable"
      class="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary/25 bg-secondary p-4 text-sm"
    >
      <span class="flex-1">{{ $t('LEGACY_IMPORT') }}</span
      ><Button :disabled="store.busy" @click="importData(legacy)">{{
        $t('IMPORT_LOCAL')
      }}</Button>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="!store.projects.length"
        @click="download"
        ><Download class="mr-2 h-3.5 w-3.5" />{{ $t('EXPORT') }}</Button
      ><Button
        v-if="store.writable"
        variant="outline"
        size="sm"
        :disabled="store.busy"
        @click="input?.click()"
        ><Upload class="mr-2 h-3.5 w-3.5" />{{ $t('IMPORT') }}</Button
      ><input
        ref="input"
        type="file"
        accept="application/json,.json"
        class="hidden"
        :aria-label="$t('IMPORT')"
        @change="readFile"
      /><span
        v-if="message"
        role="status"
        class="text-xs text-muted-foreground"
        >{{ message }}</span
      >
    </div>
  </div>
</template>
