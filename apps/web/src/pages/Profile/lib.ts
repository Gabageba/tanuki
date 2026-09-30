import { PROFILE_TABS, type ProfileTab } from '@/shared/lib/routes';

export const isProfileTab = (value: string | null): value is ProfileTab =>
  Object.values(PROFILE_TABS).some((tab) => tab === value);
