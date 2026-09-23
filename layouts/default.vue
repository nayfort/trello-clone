<template>
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-card focus:p-3"
    >{{ $t('SKIP_CONTENT') }}</a
  >
  <div class="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
    <SharedSidebar />
    <div id="main-content" tabindex="-1" class="min-w-0 p-4 sm:p-6">
      <slot />
    </div>
  </div>
</template>
