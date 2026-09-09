import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { MangaMatchesResponse } from '@tanuki/contracts';
import { MangaLinkRequestDto, MangaMatchesResponseDto } from './matches.dto';
import { MatchesService } from './matches.service';

/**
 * Живёт отдельно от MangaController намеренно: тот объявлен в CatalogModule, а матчингу нужен
 * доступ к источникам и парсерам — сложив всё в один модуль, мы получили бы цикл. Nest
 * спокойно держит два контроллера на пересекающихся префиксах.
 */
@ApiTags('manga')
@ApiParam({ name: 'sourceId', description: 'Идентификатор источника, напр. readmanga_ru' })
@ApiParam({ name: 'mangaId' })
@Controller('manga/:sourceId/:mangaId')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @ApiOperation({ summary: 'Ищет тот же тайтл на других источниках' })
  @ApiOkResponse({ type: MangaMatchesResponseDto })
  @Get('matches')
  async matches(
    @Param('sourceId') sourceId: string,
    @Param('mangaId') mangaId: string,
  ): Promise<MangaMatchesResponse> {
    return this.matchesService.findMatches(sourceId, mangaId);
  }

  /**
   * Ручная правка связи: подтвердить, забраковать или снять пометку. Один идемпотентный метод
   * покрывает все три случая, а «добавить тайтл вручную» — это тот же confirmed с
   * произвольным targetId.
   *
   * ВНИМАНИЕ: эндпоинт не защищён, а правки глобальны и видны всем — системы ролей в проекте
   * пока нет. Как только появятся аккаунты, guard вешается сюда первым делом.
   *
   * targetId передаётся телом, а не в пути: он содержит «:» и не должен зависеть от тонкостей
   * роутинга.
   */
  @ApiOperation({ summary: 'Подтверждает или скрывает связь между тайтлами' })
  @ApiBody({ type: MangaLinkRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('links')
  async setLink(
    @Param('sourceId') sourceId: string,
    @Param('mangaId') mangaId: string,
    @Body() body: MangaLinkRequestDto,
  ): Promise<void> {
    await this.matchesService.setLink(sourceId, mangaId, body.targetId, body.verdict);
  }
}
