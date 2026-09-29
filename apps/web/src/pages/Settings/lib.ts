import { SETTINGS_TABS, type SettingsTab } from '@/shared/lib/routes';

export const isSettingsTab = (value: string | null): value is SettingsTab =>
  Object.values(SETTINGS_TABS).some((tab) => tab === value);
