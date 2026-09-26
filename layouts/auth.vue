<script setup lang="ts">
const localePath = useLocalePath();
</script>
<template>
  <main class="flex min-h-screen items-center justify-center bg-muted/40 p-5">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <NuxtLink
          :to="localePath('/')"
          class="text-xl font-semibold tracking-tight"
          >Trello Clone<span class="text-primary">.</span></NuxtLink
        >
        <p class="mt-2 text-sm text-muted-foreground">
          {{ $t('AUTH_TAGLINE') }}
        </p>
      </div>
      <div class="surface p-6 sm:p-8"><slot /></div>
      <div class="mt-5 flex items-center justify-center gap-4">
        <SharedLanguageToggle /><SharedColorModeToggle />
      </div>
    </div>
  </main>
</template>
