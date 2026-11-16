import { NOTIFICATION_CATEGORY } from '@tanuki/contracts';
import { readEnumListParam } from '@/shared/lib/searchParams';

export const readNotificationsParams = (params: URLSearchParams) => ({
  categories: readEnumListParam(params, 'categories', NOTIFICATION_CATEGORY),
});
