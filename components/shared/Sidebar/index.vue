<script setup lang="ts">
import { Menu, Columns3 } from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '~/components/ui/dialog';
const open = ref(false);
</script>

<template>
  <aside
    class="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col border-r bg-card"
  >
    <SharedSidebarMenu class="min-h-0 flex-1" />
    <div class="flex items-center justify-between border-t p-4">
      <SharedColorModeToggle /><SharedLanguageToggle />
    </div>
  </aside>
  <header
    class="flex items-center justify-between border-b bg-card px-5 py-3 lg:hidden"
  >
    <span class="flex items-center gap-2 text-sm font-semibold"
      ><Columns3 class="h-5 w-5 text-primary" />Trello Clone</span
    >
    <Dialog v-model:open="open">
      <DialogTrigger as-child
        ><Button variant="ghost" size="icon" :aria-label="$t('OPEN_MENU')"
          ><Menu class="h-5 w-5" /></Button
      ></DialogTrigger>
      <DialogContent class="max-w-sm">
        <DialogTitle class="sr-only">{{ $t('WORKSPACE') }}</DialogTitle>
        <DialogDescription class="sr-only">{{
          $t('NAVIGATION')
        }}</DialogDescription>
        <SharedSidebarMenu class="min-h-[360px]" @close="open = false" />
        <div class="flex items-center justify-between border-t pt-3">
          <SharedColorModeToggle /><SharedLanguageToggle />
        </div>
      </DialogContent>
    </Dialog>
  </header>
</template>
