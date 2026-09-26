<script setup lang="ts">
import { authClient } from '~/lib/auth-client';
const props = defineProps<{
  mode: 'login' | 'register' | 'forgot' | 'reset';
}>();
const route = useRoute();
const localePath = useLocalePath();
const destination = computed(() => {
  const value = String(route.query.redirect ?? '');
  return value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\')
    ? value
    : localePath('/');
});
function authLink(path: string) {
  return { path: localePath(path), query: { redirect: destination.value } };
}

const { t } = useI18n();
const name = ref('');
const email = ref('');
const password = ref('');
const pending = ref(false);
const error = ref('');
const success = ref(false);
const titles = {
  login: 'SIGN_IN',
  register: 'CREATE_ACCOUNT',
  forgot: 'FORGOT_PASSWORD',
  reset: 'RESET_PASSWORD',
};
async function submit() {
  pending.value = true;
  error.value = '';
  try {
    let result;
    if (props.mode === 'register')
      result = await authClient.signUp.email({
        name: name.value,
        email: email.value,
        password: password.value,
        callbackURL: destination.value,
      });
    else if (props.mode === 'login')
      result = await authClient.signIn.email({
        email: email.value,
        password: password.value,
      });
    else if (props.mode === 'forgot')
      result = await authClient.requestPasswordReset({
        email: email.value,
        redirectTo: localePath('/reset-password'),
      });
    else
      result = await authClient.resetPassword({
        newPassword: password.value,
        token: String(route.query.token ?? ''),
      });
    if (result.error) {
      error.value = result.error.message || t('AUTH_FAILED');
      return;
    }
    if (props.mode === 'login') {
      useProjectsStore().$reset();
      await navigateTo(destination.value);
    } else success.value = true;
  } catch {
    error.value = t('AUTH_FAILED');
  } finally {
    pending.value = false;
  }
}
</script>
<template>
  <h1 class="text-2xl font-semibold tracking-tight">{{ $t(titles[mode]) }}</h1>
  <p
    v-if="success"
    role="status"
    class="mt-5 rounded-md bg-secondary p-4 text-sm leading-relaxed"
  >
    {{ $t(mode === 'reset' ? 'PASSWORD_UPDATED' : 'CHECK_EMAIL') }}
  </p>
  <form v-else class="mt-6 space-y-4" @submit.prevent="submit">
    <div v-if="mode === 'register'">
      <label for="auth-name" class="field-label">{{ $t('NAME') }}</label
      ><Input
        id="auth-name"
        v-model="name"
        required
        maxlength="120"
        autocomplete="name"
      />
    </div>
    <div v-if="mode !== 'reset'">
      <label for="auth-email" class="field-label">{{ $t('EMAIL') }}</label
      ><Input
        id="auth-email"
        v-model="email"
        type="email"
        required
        maxlength="254"
        autocomplete="email"
      />
    </div>
    <div v-if="mode !== 'forgot'">
      <label for="auth-password" class="field-label">{{ $t('PASSWORD') }}</label
      ><Input
        id="auth-password"
        v-model="password"
        type="password"
        required
        :minlength="mode === 'login' ? 1 : 12"
        maxlength="128"
        :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
      />
      <p v-if="mode !== 'login'" class="mt-2 text-xs text-muted-foreground">
        {{ $t('PASSWORD_HINT') }}
      </p>
    </div>
    <p v-if="error" role="alert" class="text-sm text-destructive">
      {{ error }}
    </p>
    <Button type="submit" class="w-full" :disabled="pending">{{
      $t(pending ? 'PLEASE_WAIT' : titles[mode])
    }}</Button>
  </form>
  <div class="mt-6 flex flex-wrap justify-between gap-3 text-sm">
    <NuxtLink
      v-if="mode === 'login'"
      :to="authLink('/register')"
      class="text-primary hover:underline"
      >{{ $t('CREATE_ACCOUNT') }}</NuxtLink
    ><NuxtLink
      v-else
      :to="authLink('/login')"
      class="text-primary hover:underline"
      >{{ $t('SIGN_IN') }}</NuxtLink
    ><NuxtLink
      v-if="mode === 'login'"
      :to="localePath('/forgot-password')"
      class="text-muted-foreground hover:underline"
      >{{ $t('FORGOT_PASSWORD') }}</NuxtLink
    >
  </div>
</template>
