export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}
export const useCurrentUser = () =>
  useState<CurrentUser | null>('current-user', () => null);
