<script setup lang="ts">
import { apiFetch } from '~/lib/api';

import type { BoardComment } from '~/types/board';
const props = defineProps<{
  boardId: string;
  taskId: string;
  readonly?: boolean;
}>();
const store = useProjectsStore();
const user = useCurrentUser();
const body = ref('');
const comments = ref<BoardComment[]>([]);
const loading = ref(true);
async function load() {
  try {
    comments.value = await apiFetch<BoardComment[]>(
      `/api/boards/${props.boardId}/comments`,
      { query: { taskId: props.taskId } },
    );
  } catch {
    store.error = 'Could not load comments. Try again.';
  } finally {
    loading.value = false;
  }
}
onMounted(load);
async function add() {
  if (
    await store.request(() =>
      apiFetch(`/api/boards/${props.boardId}/comments`, {
        method: 'POST',
        body: { taskId: props.taskId, body: body.value },
      }),
    )
  ) {
    body.value = '';
    await load();
  }
}
async function remove(commentId: string) {
  if (
    await store.request(() =>
      apiFetch(`/api/boards/${props.boardId}/comments`, {
        method: 'DELETE',
        body: { commentId },
      }),
    )
  )
    await load();
}
</script>
<template>
  <section class="border-t pt-5">
    <h4 class="mb-3 text-sm font-semibold">{{ $t('COMMENTS') }}</h4>
    <p v-if="loading" class="text-xs text-muted-foreground">
      {{ $t('PLEASE_WAIT') }}
    </p>
    <ul v-else class="max-h-64 space-y-3 overflow-y-auto">
      <li
        v-for="comment in comments"
        :key="comment.id"
        class="rounded-lg bg-muted/60 p-3"
      >
        <div class="flex justify-between gap-2">
          <strong class="text-xs font-medium">{{ comment.authorName }}</strong
          ><button
            v-if="
              !readonly &&
              store.writable &&
              (comment.authorId === user?.id || store.manageable)
            "
            class="rounded text-xs text-muted-foreground hover:text-destructive"
            @click="remove(comment.id)"
          >
            {{ $t('REMOVE') }}
          </button>
        </div>
        <p
          class="mt-2 whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]"
        >
          {{ comment.body }}
        </p>
        <time
          :datetime="comment.createdAt"
          class="mt-2 block text-[10px] text-muted-foreground"
          >{{ new Date(comment.createdAt).toLocaleString() }}</time
        >
      </li>
    </ul>
    <form
      v-if="store.writable && !readonly"
      class="mt-4 space-y-2"
      @submit.prevent="add"
    >
      <label :for="`comment-${taskId}`" class="sr-only">{{
        $t('WRITE_COMMENT')
      }}</label
      ><Textarea
        :id="`comment-${taskId}`"
        v-model="body"
        :placeholder="$t('WRITE_COMMENT')"
        required
        maxlength="5000"
        rows="2"
      /><Button
        size="sm"
        type="submit"
        :disabled="store.busy || !body.trim()"
        >{{ $t('POST_COMMENT') }}</Button
      >
    </form>
  </section>
</template>
