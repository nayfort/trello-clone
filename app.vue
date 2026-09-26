<script setup lang="ts">
const { locale } = useI18n();
useHead({ title: 'Trello Clone', htmlAttrs: { lang: () => locale.value } });
const store = useProjectsStore();
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') void store.refresh();
  }, 5000);
});
onUnmounted(() => clearInterval(timer));
</script>
<template>
  <NuxtLayout
    ><NuxtRouteAnnouncer />
    <div
      v-if="store.error"
      role="alert"
      class="mb-4 flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
    >
      <span>{{ store.error }}</span
      ><button
        type="button"
        :aria-label="$t('CLOSE')"
        @click="store.error = ''"
      >
        ×
      </button>
    </div>
    <NuxtPage
  /></NuxtLayout>
</template>
