import { Controller, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { USER_ROLE, type Source, type SourcesResponse } from '@tanuki/contracts';
import { Roles } from '../auth/roles.decorator';
import { SourceDto, SourcesResponseDto } from '../sources/sources.dto';
import { SourcesService } from '../sources/sources.service';
import { SourceProbeService } from './source-probe.service';

/**
 * Ручной запуск ночной проверки. Отдельный контроллер на том же префиксе, а не метод в
 * SourcesController: пробнику нужен SourcesService, и обратная зависимость замкнула бы модули
 * в цикл.
 *
 * Под @Roles(ADMIN, MODERATOR): проверка ходит в источники мимо кеша и breaker'а, гонять её
 * может только персонал (403 остальным). Смотреть статусы — `GET /sources` — по-прежнему всем.
 */
@ApiTags('sources')
@Roles(USER_ROLE.ADMIN, USER_ROLE.MODERATOR)
@Controller('sources')
export class SourceProbeController {
  constructor(
    private readonly sourceProbe: SourceProbeService,
    private readonly sourcesService: SourcesService,
  ) {}

  @ApiOperation({ summary: 'Прогоняет проверку по всем источникам и возвращает их статусы' })
  @ApiOkResponse({ type: SourcesResponseDto })
  @Post('probe')
  async probeAll(): Promise<SourcesResponse> {
    await this.sourceProbe.probeAll();
    return this.sourcesService.listGroupedSources();
  }

  @ApiOperation({ summary: 'Прогоняет проверку по одному источнику' })
  @ApiParam({ name: 'sourceId', description: 'Идентификатор источника, напр. READMANGA' })
  @ApiOkResponse({ type: SourceDto })
  @Post(':sourceId/probe')
  async probeOne(@Param('sourceId') sourceId: string): Promise<Source> {
    return this.sourceProbe.probeOne(sourceId);
  }
}
