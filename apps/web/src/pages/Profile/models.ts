import type { EnumLiteralsOf } from '@tanuki/contracts';
import type useCurrentUser from '@/entities/user/hooks/useCurrentUser';

export type CurrentUserQuery = ReturnType<typeof useCurrentUser>;

export const PROFILE_TABS = {
  STATISTICS: 'statistics',
  SIGN_IN_AND_SECURITY: 'signInAndSecurity',
  DATA: 'data',
} as const;
export type ProfileTab = EnumLiteralsOf<typeof PROFILE_TABS>;
