import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { SourcesModule } from '../sources/sources.module';
import { SearchHistoryController } from './search-history.controller';
import { SearchHistoryService } from './search-history.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

// DatabaseModule не импортируется: помечен @Global().
@Module({
  imports: [SourcesModule, CatalogModule],
  controllers: [SearchController, SearchHistoryController],
  providers: [SearchService, SearchHistoryService],
})
export class SearchModule {}
