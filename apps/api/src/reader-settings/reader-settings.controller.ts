import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ReaderSettings } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { ReaderSettingsDto, UpdateReaderSettingsRequestDto } from './reader-settings.dto';
import { ReaderSettingsService } from './reader-settings.service';

@ApiTags('reader-settings')
@Controller('reader-settings')
export class ReaderSettingsController {
  constructor(private readonly readerSettingsService: ReaderSettingsService) {}

  @ApiOperation({
    summary: 'Настройки читалки текущего пользователя — дефолты, если ещё ни разу не сохранял',
  })
  @ApiOkResponse({ type: ReaderSettingsDto })
  @Get()
  async get(@CurrentUser() user: SessionUser): Promise<ReaderSettings> {
    return this.readerSettingsService.get(user.id);
  }

  @ApiOperation({ summary: 'Сохраняет настройки читалки' })
  @ApiOkResponse({ type: ReaderSettingsDto })
  @Put()
  async update(
    @CurrentUser() user: SessionUser,
    @Body() body: UpdateReaderSettingsRequestDto,
  ): Promise<ReaderSettings> {
    return this.readerSettingsService.update(user.id, body);
  }
}
