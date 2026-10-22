import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import type { BackupPreview, BackupRestoreResult } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { BackupExportService } from './backup-export.service';
import {
  BackupDto,
  BackupPreviewDto,
  BackupPreviewRequestDto,
  BackupRestoreResultDto,
  RestoreBackupRequestDto,
} from './backup.dto';
import { BackupRestoreService } from './backup-restore.service';

@ApiTags('backup')
@Controller('backup')
export class BackupController {
  constructor(
    private readonly exportService: BackupExportService,
    private readonly restoreService: BackupRestoreService,
  ) {}

  @ApiOperation({ summary: 'Резервная копия библиотеки и настроек — файлом JSON' })
  @ApiOkResponse({ type: BackupDto })
  @Get()
  async export(@CurrentUser() user: SessionUser, @Res() reply: FastifyReply): Promise<void> {
    const backup = await this.exportService.export(user.id);
    reply
      .header(
        'content-disposition',
        `attachment; filename="tanuki-backup-${backup.exportedAt.slice(0, 10)}.json"`,
      )
      .status(HttpStatus.OK)
      .send(backup);
  }

  @ApiOperation({ summary: 'Что из копии ляжет в библиотеку — ничего не записывает' })
  @ApiBody({ type: BackupPreviewRequestDto })
  @ApiOkResponse({ type: BackupPreviewDto })
  @HttpCode(HttpStatus.OK)
  @Post('preview')
  async preview(
    @CurrentUser() user: SessionUser,
    @Body() body: BackupPreviewRequestDto,
  ): Promise<BackupPreview> {
    return this.restoreService.preview(user.id, body.backup);
  }

  @ApiOperation({ summary: 'Восстанавливает библиотеку из копии одной транзакцией' })
  @ApiBody({ type: RestoreBackupRequestDto })
  @ApiOkResponse({ type: BackupRestoreResultDto })
  @HttpCode(HttpStatus.OK)
  @Post('restore')
  async restore(
    @CurrentUser() user: SessionUser,
    @Body() body: RestoreBackupRequestDto,
  ): Promise<BackupRestoreResult> {
    return this.restoreService.restore(user.id, body);
  }
}
