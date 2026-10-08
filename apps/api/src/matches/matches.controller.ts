import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { TitleMatchesResponse } from '@tanuki/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';
import { splitCompositeId } from '../common/opaque-id';
import { TitleLinkRequestDto, TitleMatchesResponseDto } from './matches.dto';
import { MatchesService } from './matches.service';

/**
 * Живёт отдельно от TitleController намеренно: тот объявлен в CatalogModule, а матчингу нужен
 * доступ к источникам и парсерам — сложив всё в один модуль, мы получили бы цикл. Nest
 * спокойно держит два контроллера на пересекающихся префиксах.
 */
@ApiTags('titles')
@ApiParam({ name: 'titleId', description: 'Составной id тайтла — "sourceId:opaqueId"' })
@Controller('titles/:titleId')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @ApiOperation({ summary: 'Ищет тот же тайтл на других источниках' })
  @ApiOkResponse({ type: TitleMatchesResponseDto })
  @Get('matches')
  async matches(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
  ): Promise<TitleMatchesResponse> {
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    return this.matchesService.findMatches(sourceId, opaqueId, user.id);
  }

  /**
   * Ручная правка связи: подтвердить, забраковать или снять пометку. Один идемпотентный метод
   * покрывает все три случая, а «добавить тайтл вручную» — это тот же confirmed с
   * произвольным targetId.
   *
   * Правки по-прежнему глобальны и видны всем авторизованным пользователям — своей роли для
   * этого действия нет, эндпоинт закрыт только общим требованием сессии (глобальный AuthGuard).
   *
   * targetId передаётся телом, а не в пути: он содержит «:» и не должен зависеть от тонкостей
   * роутинга.
   */
  @ApiOperation({ summary: 'Подтверждает или скрывает связь между тайтлами' })
  @ApiBody({ type: TitleLinkRequestDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('links')
  async setLink(
    @CurrentUser() user: SessionUser,
    @Param('titleId') titleId: string,
    @Body() body: TitleLinkRequestDto,
  ): Promise<void> {
    const { sourceId, opaqueId } = splitCompositeId(titleId);
    await this.matchesService.setLink(
      user.id,
      sourceId,
      opaqueId,
      body.targetId,
      body.verdict,
      body.bookmarkFolderId,
    );
  }
}
