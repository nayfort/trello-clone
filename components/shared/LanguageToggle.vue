<script setup lang="ts">
const { locale, setLocale } = useI18n();
const locales = ['en', 'uk'] as const;
</script>
<template>
  <div class="flex gap-1 rounded-lg bg-muted p-1" :aria-label="$t('LANGUAGE')">
    <button
      v-for="language in locales"
      :key="language"
      type="button"
      :aria-pressed="locale === language"
      class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
      :class="
        locale === language
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      "
      @click="setLocale(language)"
    >
      {{ language.toUpperCase() }}
    </button>
  </div>
</template>
