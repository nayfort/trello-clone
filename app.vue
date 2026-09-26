<script setup lang="ts">
const { locale } = useI18n();
useHead({ title: 'Trello Clone', htmlAttrs: { lang: () => locale.value } });
const store = useProjectsStore();
const ready = ref(false);
// Prevent clicks and typing before Nuxt has attached client event handlers.
onNuxtReady(() => {
  ready.value = true;
});
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') void store.refresh();
  }, 5000);
});
onUnmounted(() => clearInterval(timer));
</script>
<template>
  <div :inert="!ready || undefined" :aria-busy="!ready">
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
  </div>
</template>
