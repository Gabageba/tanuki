import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SOURCE_IDS, type Source, type SourcesResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { SessionUser } from '../auth/session.service';
import { NotFoundApiException } from '../common/errors';
import { SourceDto, SourcesResponseDto, UpdateSourceEnabledRequestDto } from './sources.dto';
import { SourcesService } from './sources.service';
import { UserSourcesService } from './user-sources.service';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(
    private readonly sourcesService: SourcesService,
    private readonly userSources: UserSourcesService,
  ) {}

  @ApiOkResponse({
    type: SourcesResponseDto,
    description: 'Источники, сгруппированные по contentType',
  })
  @Public()
  @Get()
  async list(@CurrentUser() user: SessionUser | undefined): Promise<SourcesResponse> {
    return this.sourcesService.listGroupedSources(user?.id);
  }

  @ApiParam({ name: 'sourceId', description: 'Идентификатор источника, напр. READMANGA' })
  @ApiOkResponse({ type: SourceDto })
  @Get(':sourceId')
  async get(@Param('sourceId') sourceId: string): Promise<Source> {
    return this.sourcesService.getSource(sourceId);
  }

  @ApiOperation({ summary: 'Включает или выключает источник для текущего пользователя' })
  @ApiParam({ name: 'sourceId' })
  @ApiBody({ type: UpdateSourceEnabledRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':sourceId/enabled')
  async setEnabled(
    @CurrentUser() user: SessionUser,
    @Param('sourceId') sourceId: string,
    @Body() body: UpdateSourceEnabledRequestDto,
  ): Promise<void> {
    if (!SOURCE_IDS.some((id) => id === sourceId)) {
      throw new NotFoundApiException('sourceNotFound', { sourceId });
    }
    await this.userSources.setEnabled(user.id, sourceId, body.isEnabled);
  }
}
