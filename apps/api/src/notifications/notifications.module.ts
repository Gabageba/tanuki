import { Global, Module } from '@nestjs/common';
import { DeviceLoginService } from './device-login.service';
import { InviteExpiryService } from './invite-expiry.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsHubService } from './notifications-hub.service';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { SourceStatusNotifierService } from './source-status-notifier.service';

/**
 * Лента уведомлений, поток SSE и Web Push. Сам ни от чего прикладного не зависит — события в
 * него отправляют остальные модули (закладки, источники, аккаунт, инвайты).
 */
// Глобальный, как DatabaseModule: события шлют и ResilienceModule, и AuthModule, и LibraryModule,
// а модуль сам ни от кого из них не зависит.
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsHubService,
    PushService,
    DeviceLoginService,
    SourceStatusNotifierService,
    InviteExpiryService,
  ],
  exports: [NotificationsService, DeviceLoginService, SourceStatusNotifierService],
})
export class NotificationsModule {}
