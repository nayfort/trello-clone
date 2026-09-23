<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';
const colorMode = useColorMode();
</script>
<template>
  <Button
    variant="ghost"
    size="icon"
    :aria-label="$t('THEME')"
    @click="
      colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
    "
  >
    <ClientOnly
      ><Sun v-if="colorMode.value === 'dark'" class="h-[18px] w-[18px]" /><Moon
        v-else
        class="h-[18px] w-[18px]" /><template #fallback
        ><span class="h-[18px] w-[18px]" /></template
    ></ClientOnly>
  </Button>
</template>
