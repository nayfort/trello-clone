import type { FetchOptions } from 'ofetch';
// Use Nuxt's request transport with explicit response contracts for document APIs.
export const apiFetch = $fetch as <T = unknown>(
  url: string,
  options?: FetchOptions<'json'>,
) => Promise<T>;
