import { MANAGEMENT_TABS, type ManagementTab } from '@/shared/lib/routes';

export const isManagementTab = (value: string | null): value is ManagementTab =>
  Object.values(MANAGEMENT_TABS).some((tab) => tab === value);
