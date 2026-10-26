import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SourceImportPreview, SourceImportResult } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import {
  SourceImportPreviewDto,
  SourceImportPreviewRequestDto,
  SourceImportRequestDto,
  SourceImportResultDto,
} from './source-import.dto';
import { SourceImportService } from './source-import.service';

@ApiTags('source-import')
@Controller('source-import')
export class SourceImportController {
  constructor(private readonly service: SourceImportService) {}

  @ApiOperation({ summary: 'Папки закладок на сайте и куда они лягут — ничего не записывает' })
  @ApiBody({ type: SourceImportPreviewRequestDto })
  @ApiOkResponse({ type: SourceImportPreviewDto })
  @HttpCode(HttpStatus.OK)
  @Post('preview')
  async preview(
    @CurrentUser() user: SessionUser,
    @Body() body: SourceImportPreviewRequestDto,
  ): Promise<SourceImportPreview> {
    return this.service.preview(user.id, body.sourceId);
  }

  @ApiOperation({ summary: 'Импортирует выбранные папки сайта одной транзакцией' })
  @ApiBody({ type: SourceImportRequestDto })
  @ApiOkResponse({ type: SourceImportResultDto })
  @HttpCode(HttpStatus.OK)
  @Post()
  async import(
    @CurrentUser() user: SessionUser,
    @Body() body: SourceImportRequestDto,
  ): Promise<SourceImportResult> {
    return this.service.import(user.id, body);
  }
}
