import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Observable } from 'rxjs';
import type { NotificationsPage, PushConfig, UnreadCount } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import {
  DeleteNotificationsQueryDto,
  DeletePushSubscriptionRequestDto,
  NotificationsPageDto,
  NotificationsQueryDto,
  PushConfigDto,
  PushSubscriptionInputDto,
  UnreadCountDto,
} from './notifications.dto';
import { NotificationsHubService, type StreamMessage } from './notifications-hub.service';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly hub: NotificationsHubService,
    private readonly pushService: PushService,
  ) {}

  @ApiOperation({ summary: 'Непрочитанные уведомления, новые сверху' })
  @ApiOkResponse({ type: NotificationsPageDto })
  @Get()
  async list(
    @CurrentUser() user: SessionUser,
    @Query() query: NotificationsQueryDto,
  ): Promise<NotificationsPage> {
    return this.notificationsService.list(user, query);
  }

  @ApiOperation({ summary: 'Число непрочитанных — для бейджа колокольчика и запасного опроса' })
  @ApiOkResponse({ type: UnreadCountDto })
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: SessionUser): Promise<UnreadCount> {
    return this.notificationsService.countUnread(user);
  }

  @ApiOperation({
    summary:
      'Поток событий ленты (SSE): created / updated / removed; раз в 25 с — пульс `ping`. ' +
      'Не более 5 потоков на аккаунт в процессе API: старейший получает event: stop ' +
      'с data: {"reason":"connectionLimit"} и завершается; клиент прекращает повторы до ' +
      'перезагрузки или нового входа',
  })
  @Header('X-Accel-Buffering', 'no')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Sse('stream')
  stream(@CurrentUser() user: SessionUser): Observable<StreamMessage> {
    return this.hub.open(user.id);
  }

  @ApiOperation({ summary: 'Настройка push на инстансе: включён ли и публичный VAPID-ключ' })
  @ApiOkResponse({ type: PushConfigDto })
  @Get('push/config')
  pushConfig(): PushConfig {
    return this.pushService.getConfig();
  }

  @ApiOperation({ summary: 'Подписывает текущее устройство на push' })
  @ApiBody({ type: PushSubscriptionInputDto })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('push/subscriptions')
  async subscribe(
    @CurrentUser() user: SessionUser,
    @Body() body: PushSubscriptionInputDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<void> {
    await this.pushService.subscribe(user.id, body, userAgent);
  }

  @ApiOperation({ summary: 'Отписывает устройство от push' })
  @ApiBody({ type: DeletePushSubscriptionRequestDto })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('push/subscriptions')
  async unsubscribe(
    @CurrentUser() user: SessionUser,
    @Body() body: DeletePushSubscriptionRequestDto,
  ): Promise<void> {
    await this.pushService.unsubscribe(user.id, body.endpoint);
  }

  @ApiOperation({ summary: 'Прочитано / убрать: удаляет все уведомления, с учётом категории' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async removeAll(
    @CurrentUser() user: SessionUser,
    @Query() query: DeleteNotificationsQueryDto,
  ): Promise<void> {
    await this.notificationsService.removeAll(user, query.category);
  }

  @ApiOperation({ summary: 'Прочитано / убрать: удаляет одно уведомление' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.notificationsService.remove(user.id, id);
  }
}
