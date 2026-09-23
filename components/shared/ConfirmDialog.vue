<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '~/components/ui/dialog';
defineProps<{ title: string; description: string }>();
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ confirm: [] }>();
function confirm() {
  open.value = false;
  emit('confirm');
}
</script>
<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader
        ><DialogTitle>{{ title }}</DialogTitle
        ><DialogDescription class="break-words pt-2 leading-relaxed">{{
          description
        }}</DialogDescription></DialogHeader
      >
      <DialogFooter class="gap-2"
        ><Button variant="outline" @click="open = false">{{
          $t('CANCEL')
        }}</Button
        ><Button variant="destructive" @click="confirm">{{
          $t('DELETE_CONFIRM')
        }}</Button></DialogFooter
      >
    </DialogContent>
  </Dialog>
</template>
