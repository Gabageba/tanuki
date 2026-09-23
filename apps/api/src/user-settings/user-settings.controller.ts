import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { UserSettings } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { UserSettingsDto, UpdateUserSettingsRequestDto } from './user-settings.dto';
import { UserSettingsService } from './user-settings.service';

@ApiTags('user-settings')
@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @ApiOperation({
    summary:
      'Настройки текущего пользователя, не завязанные на страницу — тема, вид каталога, язык и т.п. ' +
      'Партиальный объект: чего нет — ещё не сохранялось, клиент берёт из localStorage',
  })
  @ApiOkResponse({ type: UserSettingsDto })
  @Get()
  async get(@CurrentUser() user: SessionUser): Promise<UserSettings> {
    return this.userSettingsService.get(user.id);
  }

  @ApiOperation({ summary: 'Сохраняет патч настроек — переданные поля, остальные не трогает' })
  @ApiOkResponse({ type: UserSettingsDto })
  @Put()
  async update(
    @CurrentUser() user: SessionUser,
    @Body() body: UpdateUserSettingsRequestDto,
  ): Promise<UserSettings> {
    return this.userSettingsService.update(user.id, body);
  }
}
