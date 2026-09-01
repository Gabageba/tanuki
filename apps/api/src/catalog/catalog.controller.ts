import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { CatalogResponse, FiltersResponse } from '@tanuki/contracts';
import { CatalogResponseDto, FiltersResponseDto } from './catalog.dto';
import { CatalogService } from './catalog.service';
import { parseFilterQuery } from './parse-filter-query';

@ApiTags('catalog')
@ApiParam({ name: 'sourceId', description: 'Идентификатор источника, напр. READMANGA' })
@Controller('sources/:sourceId')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы, с 0' })
  @ApiQuery({ name: 'order', required: false, type: String })
  @ApiQuery({ name: 'direction', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'refresh', required: false, type: Boolean })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: [String],
    description:
      'Повторяемый параметр вида `groupId:key` (включить), `groupId:!key` (исключить) или ' +
      '`groupId:min..max` для RANGE-групп (любая граница может быть пустой)',
  })
  @ApiOkResponse({ type: CatalogResponseDto })
  @Get('manga')
  async list(
    @Param('sourceId') sourceId: string,
    @Query('page') page: string | undefined,
    @Query('order') order: string | undefined,
    @Query('direction') direction: string | undefined,
    @Query('query') query: string | undefined,
    @Query('refresh') refresh: string | undefined,
    @Query('filters') filters: string[] | string | undefined,
  ): Promise<CatalogResponse> {
    return this.catalogService.listCatalog(sourceId, {
      page: page ? Number.parseInt(page, 10) : 0,
      order,
      direction,
      query,
      force: refresh === 'true',
      filters: parseFilterQuery(filters),
    });
  }

  @ApiOkResponse({ type: FiltersResponseDto })
  @Get('filters')
  async filters(@Param('sourceId') sourceId: string): Promise<FiltersResponse> {
    return this.catalogService.listFilters(sourceId);
  }
}
