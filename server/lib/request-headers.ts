import { getRequestIP, type H3Event } from 'h3';
export function authHeaders(event: H3Event) {
  const headers = new Headers(event.headers);
  // The custom header is always replaced, never accepted from a client.
  const address = getRequestIP(event, {
    xForwardedFor: process.env.TRUST_PROXY === 'true',
  });
  headers.set('x-trello-client-ip', address ?? '127.0.0.1');
  return headers;
}
