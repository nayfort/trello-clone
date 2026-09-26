<script setup lang="ts">
import { ref, onMounted, type HTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  disabled?: boolean;
  defaultValue?: string | number;
  modelValue?: string | number;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
</script>

<template>
  <textarea
    v-model="modelValue"
    :disabled="props.disabled || !mounted"
    :class="
      cn(
        'flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none',
        props.class,
      )
    "
  />
</template>
