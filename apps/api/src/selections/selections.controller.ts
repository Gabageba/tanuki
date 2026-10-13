import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { SelectionsResponse, SelectionsSectionResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import {
  SelectionsResponseDto,
  SelectionsSectionQueryDto,
  SelectionsSectionResponseDto,
} from './selections.dto';
import { SelectionsService } from './selections.service';

@ApiTags('selections')
@ApiParam({ name: 'sourceId', description: 'Идентификатор источника, напр. remanga' })
@Controller('selections')
export class SelectionsController {
  constructor(private readonly selectionsService: SelectionsService) {}

  @ApiOperation({
    summary: 'Подборки источника — блоки с главной его сайта; не ответил — статус, а не ошибка',
  })
  @ApiOkResponse({ type: SelectionsResponseDto })
  @Get(':sourceId')
  async get(
    @CurrentUser() user: SessionUser,
    @Param('sourceId') sourceId: string,
  ): Promise<SelectionsResponse> {
    return this.selectionsService.get(user.id, sourceId);
  }

  @ApiOperation({
    summary:
      'Порция одного блока подборок: листается, если сайт отдаёт блок порциями; у «Сейчас читают» — период',
  })
  @ApiParam({ name: 'sectionId', description: 'Идентификатор блока, напр. hotNew' })
  @ApiOkResponse({ type: SelectionsSectionResponseDto })
  @Get(':sourceId/:sectionId')
  async getSection(
    @CurrentUser() user: SessionUser,
    @Param('sourceId') sourceId: string,
    @Param('sectionId') sectionId: string,
    @Query() query: SelectionsSectionQueryDto,
  ): Promise<SelectionsSectionResponse> {
    return this.selectionsService.getSection(user.id, sourceId, sectionId, query);
  }
}
