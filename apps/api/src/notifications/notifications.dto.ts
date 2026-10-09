import { createZodDto } from 'nestjs-zod';
import {
  DeleteNotificationsQuerySchema,
  DeletePushSubscriptionRequestSchema,
  NotificationsPageSchema,
  NotificationsQuerySchema,
  PushConfigSchema,
  PushSubscriptionInputSchema,
  UnreadCountSchema,
} from '@tanuki/contracts';

export class NotificationsQueryDto extends createZodDto(NotificationsQuerySchema) {}
export class NotificationsPageDto extends createZodDto(NotificationsPageSchema) {}
export class DeleteNotificationsQueryDto extends createZodDto(DeleteNotificationsQuerySchema) {}
export class UnreadCountDto extends createZodDto(UnreadCountSchema) {}
export class PushConfigDto extends createZodDto(PushConfigSchema) {}
export class PushSubscriptionInputDto extends createZodDto(PushSubscriptionInputSchema) {}
export class DeletePushSubscriptionRequestDto extends createZodDto(
  DeletePushSubscriptionRequestSchema,
) {}
