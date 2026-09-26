export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/^\/uk(?=\/|$)/, '') || '/';
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];
  if (publicPaths.includes(path)) return;
  const headers = import.meta.server
    ? useRequestHeaders(['cookie'])
    : undefined;
  const session = await $fetch<{
    user: { id: string; name: string; email: string };
  } | null>('/api/auth/get-session', { headers });
  const user = useCurrentUser();
  const store = useProjectsStore();
  if (user.value?.id !== session?.user?.id) store.$reset();
  user.value = session?.user ?? null;
  if (!user.value)
    return navigateTo({
      path: to.path.startsWith('/uk') ? '/uk/login' : '/login',
      query: { redirect: to.fullPath },
    });
  if (path === '/invite') return;
  if (!store.initialized) await store.load(headers);
});
