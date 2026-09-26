export default defineEventHandler((event) => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff');
  setHeader(event, 'Referrer-Policy', 'same-origin');
  setHeader(event, 'X-Frame-Options', 'DENY');
  if (!event.path.startsWith('/api/')) return;
  setHeader(event, 'Cache-Control', 'no-store');
  if (['GET', 'HEAD', 'OPTIONS'].includes(event.method)) return;
  const expected = process.env.BETTER_AUTH_URL;
  if (!expected || getHeader(event, 'origin') !== new URL(expected).origin)
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid request origin',
    });
  if (Number(getHeader(event, 'content-length') || 0) > 2_000_000)
    throw createError({
      statusCode: 413,
      statusMessage: 'Request is too large',
    });
  if (
    event.method !== 'DELETE' &&
    !getHeader(event, 'content-type')?.startsWith('application/json')
  )
    throw createError({ statusCode: 415, statusMessage: 'JSON is required' });
});
